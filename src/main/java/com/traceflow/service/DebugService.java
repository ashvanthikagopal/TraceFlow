package com.traceflow.service;

import com.sun.jdi.*;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.event.*;
import com.sun.jdi.request.*;
import com.traceflow.util.TraceUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.util.*;

@Service
public class DebugService {

    private static final Logger log = LoggerFactory.getLogger(DebugService.class);

    private final int maxSteps;
    private final long timeoutMs;

    public DebugService(
            @Value("${traceflow.tracer.max-steps:500}") int maxSteps,
            @Value("${traceflow.tracer.timeout-ms:5000}") long timeoutMs) {
        this.maxSteps = maxSteps;
        this.timeoutMs = timeoutMs;
    }

    public static class RawTraceStep {
        private int stepNo;
        private String eventType;
        private String className;
        private String methodName;
        private int lineNo;
        private String message;
        private long timestamp;
        private Map<String, RawVariable> variables = new LinkedHashMap<>();

        public int getStepNo() { return stepNo; }
        public void setStepNo(int stepNo) { this.stepNo = stepNo; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public String getMethodName() { return methodName; }
        public void setMethodName(String methodName) { this.methodName = methodName; }
        public int getLineNo() { return lineNo; }
        public void setLineNo(int lineNo) { this.lineNo = lineNo; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        public Map<String, RawVariable> getVariables() { return variables; }
        public void setVariables(Map<String, RawVariable> variables) { this.variables = variables; }
    }

    public static class RawVariable {
        private String name;
        private String value;
        private String dataType;
        private String scope;

        public RawVariable(String name, String value, String dataType, String scope) {
            this.name = name;
            this.value = value;
            this.dataType = dataType;
            this.scope = scope;
        }

        public String getName() { return name; }
        public String getValue() { return value; }
        public String getDataType() { return dataType; }
        public String getScope() { return scope; }
    }

    public static class DebugExecutionResult {
        private final List<RawTraceStep> steps;
        private final boolean hitMaxSteps;
        private final boolean timedOut;
        private final String exceptionMessage;
        private final long durationMs;

        public DebugExecutionResult(List<RawTraceStep> steps, boolean hitMaxSteps, boolean timedOut, String exceptionMessage, long durationMs) {
            this.steps = steps;
            this.hitMaxSteps = hitMaxSteps;
            this.timedOut = timedOut;
            this.exceptionMessage = exceptionMessage;
            this.durationMs = durationMs;
        }

        public List<RawTraceStep> getSteps() { return steps; }
        public boolean isHitMaxSteps() { return hitMaxSteps; }
        public boolean isTimedOut() { return timedOut; }
        public String getExceptionMessage() { return exceptionMessage; }
        public long getDurationMs() { return durationMs; }
    }

    public DebugExecutionResult traceExecution(Path binDir, String mainClassName) {
        List<RawTraceStep> traceSteps = new ArrayList<>();
        boolean hitMaxSteps = false;
        boolean timedOut = false;
        String capturedException = null;
        long startTime = System.currentTimeMillis();

        VirtualMachine vm = null;
        try {
            LaunchingConnector connector = findLaunchingConnector();
            if (connector == null) {
                throw new IllegalStateException("JDI LaunchingConnector not available in runtime environment.");
            }

            Map<String, Connector.Argument> arguments = connector.defaultArguments();
            String cp = binDir.toAbsolutePath().normalize().toString();

            log.info("Using JDI Connector: {} with arguments: {}", connector.name(), arguments.keySet());

            if (arguments.containsKey("command")) {
                // RawCommandLineLaunch
                arguments.get("command").setValue("java -cp \"" + cp + "\" " + mainClassName);
            } else {
                // CommandLineLaunch
                if (arguments.containsKey("main")) {
                    arguments.get("main").setValue(mainClassName);
                }
                if (arguments.containsKey("options")) {
                    arguments.get("options").setValue("-cp \"" + cp + "\"");
                }
                if (arguments.containsKey("home")) {
                    String javaHome = System.getProperty("java.home");
                    arguments.get("home").setValue(javaHome);
                }
                if (arguments.containsKey("vmexec")) {
                    arguments.get("vmexec").setValue("java");
                }
                if (arguments.containsKey("quote")) {
                    arguments.get("quote").setValue("\"");
                }
                if (arguments.containsKey("suspend")) {
                    arguments.get("suspend").setValue("true");
                }
            }

            vm = connector.launch(arguments);
            EventRequestManager erm = vm.eventRequestManager();

            // Request class prepare event for target class
            ClassPrepareRequest cpr = erm.createClassPrepareRequest();
            cpr.addClassFilter(mainClassName);
            cpr.setSuspendPolicy(EventRequest.SUSPEND_ALL);
            cpr.enable();

            // Request general method entry/exit for target class filter
            MethodEntryRequest mer = erm.createMethodEntryRequest();
            mer.addClassFilter(mainClassName);
            mer.setSuspendPolicy(EventRequest.SUSPEND_ALL);
            mer.enable();

            MethodExitRequest mxr = erm.createMethodExitRequest();
            mxr.addClassFilter(mainClassName);
            mxr.setSuspendPolicy(EventRequest.SUSPEND_ALL);
            mxr.enable();

            // Request exception events
            ExceptionRequest er = erm.createExceptionRequest(null, true, true);
            er.addClassFilter(mainClassName);
            er.setSuspendPolicy(EventRequest.SUSPEND_ALL);
            er.enable();

            // Resume VM
            vm.resume();

            EventQueue queue = vm.eventQueue();
            int currentStepNo = 1;
            boolean isRunning = true;
            Set<ThreadReference> threadsWithStep = new HashSet<>();

            while (isRunning) {
                if (System.currentTimeMillis() - startTime > timeoutMs) {
                    timedOut = true;
                    hitMaxSteps = true;
                    break;
                }
                if (currentStepNo > maxSteps) {
                    hitMaxSteps = true;
                    break;
                }

                EventSet eventSet = queue.remove(500);
                if (eventSet == null) {
                    continue;
                }

                for (Event event : eventSet) {
                    if (event instanceof VMStartEvent) {
                        log.debug("VM Started");
                    } else if (event instanceof ClassPrepareEvent) {
                        ClassPrepareEvent cpe = (ClassPrepareEvent) event;
                        ThreadReference thread = cpe.thread();
                        if (thread != null && !threadsWithStep.contains(thread)) {
                            enableStepForThread(erm, thread, mainClassName);
                            threadsWithStep.add(thread);
                        }
                    } else if (event instanceof MethodEntryEvent) {
                        MethodEntryEvent mee = (MethodEntryEvent) event;
                        Location loc = mee.location();
                        if (isTargetClass(loc, mainClassName)) {
                            ThreadReference thread = mee.thread();
                            if (thread != null && !threadsWithStep.contains(thread)) {
                                enableStepForThread(erm, thread, mainClassName);
                                threadsWithStep.add(thread);
                            }
                            RawTraceStep step = recordStep(currentStepNo++, "METHOD_ENTRY", loc, thread, "Entering method: " + loc.method().name() + "()");
                            if (step != null) traceSteps.add(step);
                        }
                    } else if (event instanceof MethodExitEvent) {
                        MethodExitEvent mxe = (MethodExitEvent) event;
                        Location loc = mxe.location();
                        if (isTargetClass(loc, mainClassName)) {
                            RawTraceStep step = recordStep(currentStepNo++, "METHOD_EXIT", loc, mxe.thread(), "Exiting method: " + loc.method().name() + "()");
                            if (step != null) traceSteps.add(step);
                        }
                    } else if (event instanceof StepEvent) {
                        StepEvent se = (StepEvent) event;
                        Location loc = se.location();
                        if (isTargetClass(loc, mainClassName)) {
                            RawTraceStep step = recordStep(currentStepNo++, "LINE", loc, se.thread(), "Executed line " + loc.lineNumber());
                            if (step != null) traceSteps.add(step);
                        }
                    } else if (event instanceof ExceptionEvent) {
                        ExceptionEvent ee = (ExceptionEvent) event;
                        Location loc = ee.location();
                        ObjectReference exception = ee.exception();
                        String exName = exception != null ? exception.referenceType().name() : "Exception";
                        capturedException = exName;
                        if (isTargetClass(loc, mainClassName)) {
                            RawTraceStep step = recordStep(currentStepNo++, "EXCEPTION", loc, ee.thread(), "Exception thrown: " + exName);
                            if (step != null) traceSteps.add(step);
                        }
                    } else if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
                        isRunning = false;
                        break;
                    }
                }

                try {
                    eventSet.resume();
                } catch (VMDisconnectedException e) {
                    isRunning = false;
                }
            }

            if (traceSteps.isEmpty() && vm.process() != null) {
                try (BufferedReader err = new BufferedReader(new InputStreamReader(vm.process().getErrorStream()))) {
                    String errLine;
                    while ((errLine = err.readLine()) != null) {
                        log.warn("Target VM process stderr: {}", errLine);
                    }
                } catch (Exception ignored) {}
            }

        } catch (VMDisconnectedException e) {
            log.debug("Target VM disconnected normally.");
        } catch (Exception e) {
            log.error("Error during JDI tracing", e);
            if (capturedException == null) {
                capturedException = e.getMessage();
            }
        } finally {
            if (vm != null) {
                try {
                    vm.exit(0);
                } catch (Exception ignored) {
                }
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        return new DebugExecutionResult(traceSteps, hitMaxSteps, timedOut, capturedException, duration);
    }

    private void enableStepForThread(EventRequestManager erm, ThreadReference thread, String mainClassName) {
        try {
            StepRequest sr = erm.createStepRequest(thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO);
            sr.addClassFilter(mainClassName);
            sr.setSuspendPolicy(EventRequest.SUSPEND_ALL);
            sr.enable();
        } catch (Exception ignored) {
        }
    }

    private boolean isTargetClass(Location loc, String mainClassName) {
        if (loc == null || loc.declaringType() == null) return false;
        String name = loc.declaringType().name();
        return name.equals(mainClassName) || name.endsWith("." + mainClassName) || name.contains(mainClassName);
    }

    private RawTraceStep recordStep(int stepNo, String eventType, Location loc, ThreadReference thread, String message) {
        try {
            RawTraceStep step = new RawTraceStep();
            step.setStepNo(stepNo);
            step.setEventType(eventType);
            step.setClassName(loc.declaringType().name());
            step.setMethodName(loc.method().name());
            step.setLineNo(loc.lineNumber());
            step.setMessage(message);
            step.setTimestamp(System.currentTimeMillis());

            if (thread != null && thread.frameCount() > 0) {
                StackFrame frame = thread.frame(0);
                try {
                    for (LocalVariable var : frame.visibleVariables()) {
                        com.sun.jdi.Value val = frame.getValue(var);
                        String formattedVal = TraceUtil.formatJdiValue(val);
                        String typeName = TraceUtil.formatTypeName(var.signature());
                        step.getVariables().put(var.name(), new RawVariable(var.name(), formattedVal, typeName, "local"));
                    }
                } catch (AbsentInformationException ignored) {
                    // Compiled without debug info or no visible variables at this exact offset
                }
            }
            return step;
        } catch (Exception e) {
            return null;
        }
    }

    private LaunchingConnector findLaunchingConnector() {
        VirtualMachineManager vmm = Bootstrap.virtualMachineManager();
        for (LaunchingConnector lc : vmm.launchingConnectors()) {
            if ("com.sun.jdi.CommandLineLaunch".equals(lc.name())) {
                return lc;
            }
        }
        for (LaunchingConnector lc : vmm.launchingConnectors()) {
            if (lc.name().contains("CommandLineLaunch")) {
                return lc;
            }
        }
        return vmm.defaultConnector();
    }
}
