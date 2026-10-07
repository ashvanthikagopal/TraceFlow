package com.traceflow.service;

import com.traceflow.parser.StaticIssueDetector;
import com.traceflow.source.dto.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ExplanationService {

    private final StaticIssueDetector staticIssueDetector;

    public ExplanationService(StaticIssueDetector staticIssueDetector) {
        this.staticIssueDetector = staticIssueDetector;
    }

    public AnalysisResponse.ExplanationDto generateExplanation(
            String sourceCode,
            List<StaticIssueDto> staticIssues,
            List<CompilerDiagnosticDto> compilerDiagnostics,
            DebugService.DebugExecutionResult executionResult,
            TraceResponse traceResponse,
            AnalysisResponse.BugPredictionDto bugPrediction) {

        List<String> keyObservations = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        String riskLevel = "SAFE";
        StringBuilder behaviorBuilder = new StringBuilder();

        boolean hasCompileErrors = compilerDiagnostics != null && compilerDiagnostics.stream().anyMatch(d -> "ERROR".equalsIgnoreCase(d.getKind()));

        // 1. Compilation & Syntax Diagnostics
        if (hasCompileErrors) {
            riskLevel = "CRITICAL";
            keyObservations.add("Compilation Failure: The Java source code contains syntax or type incompatibility errors.");
            for (CompilerDiagnosticDto d : compilerDiagnostics) {
                if ("ERROR".equalsIgnoreCase(d.getKind())) {
                    keyObservations.add(String.format("Line %d: %s", d.getLineNo(), d.getMessage()));
                    suggestions.add(String.format("Line %d: Fix compiler error '%s'", d.getLineNo(), d.getMessage()));
                }
            }
        }

        // 2. Static Analysis & Semantic Findings
        if (staticIssues != null && !staticIssues.isEmpty()) {
            for (StaticIssueDto issue : staticIssues) {
                keyObservations.add(String.format("Line %d [%s]: %s", issue.getLineNo(), issue.getSeverity(), issue.getMessage()));
                if (issue.getSuggestion() != null) {
                    suggestions.add(String.format("Line %d Fix: %s", issue.getLineNo(), issue.getSuggestion()));
                }
                if ("ERROR".equalsIgnoreCase(issue.getSeverity()) && !"CRITICAL".equals(riskLevel)) {
                    riskLevel = "HIGH";
                } else if ("WARNING".equalsIgnoreCase(issue.getSeverity()) && "SAFE".equals(riskLevel)) {
                    riskLevel = "MEDIUM";
                }
            }
        }

        // 3. Runtime & Debugger Tracing
        if (traceResponse != null && executionResult != null) {
            int totalSteps = traceResponse.getTotalSteps();
            keyObservations.add("Dynamic JDI Execution: Traced " + totalSteps + " runtime steps in " + executionResult.getDurationMs() + "ms.");

            if (executionResult.isHitMaxSteps()) {
                riskLevel = "CRITICAL";
                keyObservations.add("Execution safeguard triggered: Program hit the maximum step threshold (500 steps), confirming an infinite loop.");
                suggestions.add("Ensure loop counters increment toward the termination condition.");
            }

            if (executionResult.getExceptionMessage() != null) {
                riskLevel = "HIGH";
                String ex = executionResult.getExceptionMessage();
                keyObservations.add("Runtime exception caught during execution: " + ex);
                if (ex.toLowerCase().contains("nullpointer")) {
                    suggestions.add("Ensure object instances are initialized with 'new' before invoking methods.");
                } else if (ex.toLowerCase().contains("arithmetic") || ex.toLowerCase().contains("divide by zero") || ex.toLowerCase().contains("/ by zero")) {
                    suggestions.add("Division by zero: Guard arithmetic operations with 'if (divisor != 0)' before dividing.");
                } else if (ex.toLowerCase().contains("indexoutofbounds") || ex.toLowerCase().contains("arrayindex")) {
                    suggestions.add("Array/List index out of bounds: Ensure loop bound uses '< length' or '< size()' (0-indexed).");
                } else if (ex.toLowerCase().contains("stackoverflow")) {
                    suggestions.add("StackOverflowError: Add base termination case at the top of the recursive method.");
                }
            }
        }

        // 4. ML Behavioral Classifier Narrative
        String predictedBug = bugPrediction != null ? bugPrediction.getBugType() : (hasCompileErrors ? "COMPILATION_ERROR" : "NORMAL");
        switch (predictedBug) {
            case "ARITHMETIC_ERROR" -> {
                riskLevel = "HIGH";
                behaviorBuilder.append("An ArithmeticException (division or modulo by zero) occurred during execution. Dividing any number by zero is mathematically undefined and causes the JVM runtime to immediately abort execution.");
            }
            case "TYPE_MISMATCH" -> {
                riskLevel = "HIGH";
                behaviorBuilder.append("A Type Mismatch was detected. The code assigns data of one type to a variable of an incompatible type (such as reading an integer from Scanner into a String variable or vice versa).");
            }
            case "RESOURCE_LEAK" -> {
                if (!"CRITICAL".equals(riskLevel)) riskLevel = "MEDIUM";
                behaviorBuilder.append("A potential system resource leak was found. An IO stream, Scanner, or handle was allocated without being closed via .close() or try-with-resources.");
            }
            case "LOGICAL_BUG" -> {
                if (!"CRITICAL".equals(riskLevel)) riskLevel = "HIGH";
                behaviorBuilder.append("A logical error was identified in the code flow (such as parameter self-assignment 'name = name' failing to set 'this.name', or using assignment '=' inside an if condition).");
            }
            case "INFINITE_LOOP" -> {
                riskLevel = "CRITICAL";
                behaviorBuilder.append("The program gets trapped in an infinite loop where the counter moves away from or never satisfies the termination condition. Execution was halted by the debugger safeguard.");
            }
            case "OFF_BY_ONE" -> {
                if (!"CRITICAL".equals(riskLevel)) riskLevel = "HIGH";
                behaviorBuilder.append("The program attempts to index beyond the boundary of a collection or array due to a '<=' comparison on a zero-indexed collection.");
            }
            case "NULL_POINTER" -> {
                if (!"CRITICAL".equals(riskLevel)) riskLevel = "HIGH";
                behaviorBuilder.append("An uninitialized object reference was dereferenced at runtime. Attempting to invoke methods or read fields on a null reference triggers NullPointerException.");
            }
            case "RECURSION_RISK" -> {
                riskLevel = "CRITICAL";
                behaviorBuilder.append("Unbounded recursion was detected. The recursive method calls itself without hitting a valid base case, causing continuous stack frame allocation until StackOverflowError.");
            }
            case "COMPILATION_ERROR" -> {
                behaviorBuilder.append("The program contains syntax errors, type mismatches, or missing semicolons/braces that prevent bytecode generation.");
            }
            default -> {
                behaviorBuilder.append("The program executed cleanly through all control flow branches, loops, and method invocations without encountering runtime exceptions or anomalies.");
            }
        }

        // Generate repaired Java code snippet
        String fixedCode = staticIssueDetector.generateCorrectedCode(sourceCode, staticIssues, compilerDiagnostics);

        // Default suggestion if list was empty
        if (suggestions.isEmpty()) {
            suggestions.add("Clean execution! All variables, loops, and condition branches performed without anomalies.");
        }

        String summary = hasCompileErrors
                ? "Multiple Syntax & Compilation Errors Detected: Code contains syntax or type errors."
                : switch (predictedBug) {
                    case "ARITHMETIC_ERROR" -> "Arithmetic Exception Detected: Division or modulo by zero.";
                    case "TYPE_MISMATCH" -> "Type Mismatch Detected: Incompatible data types assigned.";
                    case "RESOURCE_LEAK" -> "Resource Leak Detected: Unclosed Scanner or Stream resource.";
                    case "LOGICAL_BUG" -> "Logical Bug Detected: Variable shadowing or conditional assignment.";
                    case "INFINITE_LOOP" -> "Infinite Loop Detected: The program runs indefinitely and fails to terminate.";
                    case "OFF_BY_ONE" -> "Off-By-One Bug Detected: Index exceeded collection boundaries.";
                    case "NULL_POINTER" -> "Null Pointer Bug Detected: Accessing uninitialized reference.";
                    case "RECURSION_RISK" -> "Recursion Risk Detected: Missing base condition causes stack overflow.";
                    default -> "Program Analysis Completed: Structural AST and execution timeline generated.";
                };

        return new AnalysisResponse.ExplanationDto(
                summary,
                behaviorBuilder.toString().trim(),
                keyObservations,
                suggestions,
                fixedCode,
                riskLevel
        );
    }
}
