package com.traceflow.service;

import com.traceflow.source.dto.CompilerDiagnosticDto;
import com.traceflow.source.dto.FeatureVectorDto;
import com.traceflow.source.dto.StaticIssueDto;
import com.traceflow.source.dto.TraceResponse;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class FeatureExtractionService {

    public FeatureVectorDto extractFeatures(
            String sourceCode,
            List<StaticIssueDto> staticIssues,
            List<CompilerDiagnosticDto> compilerDiagnostics,
            DebugService.DebugExecutionResult executionResult,
            TraceResponse traceResponse) {

        int codeLines = sourceCode != null ? sourceCode.split("\\r?\\n").length : 1;
        double syntaxErrorCount = 0;
        double typeMismatchCount = 0;
        double arithmeticRiskCount = 0;
        double resourceLeakCount = 0;
        double logicalBugCount = 0;
        double cyclomaticComplexity = 1;

        if (compilerDiagnostics != null) {
            for (CompilerDiagnosticDto d : compilerDiagnostics) {
                if ("ERROR".equalsIgnoreCase(d.getKind())) {
                    syntaxErrorCount++;
                    String msg = d.getMessage() != null ? d.getMessage().toLowerCase() : "";
                    if (msg.contains("incompatible") || msg.contains("cannot be converted") || msg.contains("type mismatch")) {
                        typeMismatchCount++;
                    }
                }
            }
        }

        if (staticIssues != null) {
            for (StaticIssueDto issue : staticIssues) {
                String rule = issue.getRuleId() != null ? issue.getRuleId().toUpperCase() : "";
                if (rule.contains("TYPE_MISMATCH")) {
                    typeMismatchCount++;
                } else if (rule.contains("DIVISION_BY_ZERO") || rule.contains("INTEGER_DIVISION")) {
                    arithmeticRiskCount++;
                } else if (rule.contains("RESOURCE_LEAK")) {
                    resourceLeakCount++;
                } else if (rule.contains("SELF_ASSIGNMENT") || rule.contains("ASSIGN_IN_IF") || rule.contains("UNREACHABLE")) {
                    logicalBugCount++;
                }
            }
        }

        // Cyclomatic complexity estimation from AST/keywords
        if (sourceCode != null) {
            int branchCount = countOccurrences(sourceCode, "if ") + countOccurrences(sourceCode, "if(")
                    + countOccurrences(sourceCode, "for ") + countOccurrences(sourceCode, "for(")
                    + countOccurrences(sourceCode, "while ") + countOccurrences(sourceCode, "while(")
                    + countOccurrences(sourceCode, "case ") + countOccurrences(sourceCode, "catch");
            cyclomaticComplexity = Math.max(1, branchCount + 1);
        }

        List<TraceResponse.StepDto> steps = traceResponse != null ? traceResponse.getSteps() : Collections.emptyList();
        double executionDuration = executionResult != null ? executionResult.getDurationMs() : 0;
        double executionSteps = steps != null ? steps.size() : 0;

        if (steps == null || steps.isEmpty()) {
            double initialExceptionCount = (executionResult != null && executionResult.getExceptionMessage() != null) ? 1.0 : 0.0;
            return new FeatureVectorDto(
                    0, 0, 0, 0, 0, 0,
                    initialExceptionCount,
                    0, executionSteps, executionDuration,
                    syntaxErrorCount, typeMismatchCount, arithmeticRiskCount,
                    resourceLeakCount, logicalBugCount, cyclomaticComplexity, codeLines
            );
        }

        // 1. Method calls & Recursion Depth
        double methodCallCount = 0;
        int maxRecursionDepth = 0;
        Map<String, Integer> methodActiveDepth = new HashMap<>();

        for (TraceResponse.StepDto step : steps) {
            if ("METHOD_ENTRY".equals(step.getEventType())) {
                methodCallCount++;
                String mName = step.getMethodName();
                int depth = methodActiveDepth.getOrDefault(mName, 0) + 1;
                methodActiveDepth.put(mName, depth);
                if (depth > maxRecursionDepth) {
                    maxRecursionDepth = depth;
                }
            } else if ("METHOD_EXIT".equals(step.getEventType())) {
                String mName = step.getMethodName();
                int depth = methodActiveDepth.getOrDefault(mName, 1) - 1;
                methodActiveDepth.put(mName, Math.max(0, depth));
            }
        }

        double recursionDepth = maxRecursionDepth;

        // 2. Loop iterations & Condition repeats
        Map<Integer, Integer> lineExecutionCounts = new HashMap<>();
        for (TraceResponse.StepDto step : steps) {
            if ("LINE".equals(step.getEventType()) && step.getLineNo() != null && step.getLineNo() > 0) {
                lineExecutionCounts.put(step.getLineNo(), lineExecutionCounts.getOrDefault(step.getLineNo(), 0) + 1);
            }
        }

        double maxLineRepeats = 0;
        double conditionRepeatCount = 0;
        for (int count : lineExecutionCounts.values()) {
            if (count > maxLineRepeats) {
                maxLineRepeats = count;
            }
            if (count > 1) {
                conditionRepeatCount += count;
            }
        }

        double loopIterationCount = maxLineRepeats > 1 ? maxLineRepeats - 1 : 0;

        // If execution terminated due to step limits, verify infinite loop vs recursion
        if (executionResult != null && executionResult.isHitMaxSteps()) {
            if (recursionDepth >= 10) {
                loopIterationCount = 0;
            } else {
                loopIterationCount = Math.max(loopIterationCount, 500);
            }
        }

        // 3. Variable mutations
        int totalMutations = 0;
        Map<String, Integer> variableMutationCounts = new HashMap<>();
        for (TraceResponse.StepDto step : steps) {
            if (step.getVariables() != null) {
                for (Map.Entry<String, TraceResponse.VariableItemDto> v : step.getVariables().entrySet()) {
                    if (v.getValue().isChanged()) {
                        totalMutations++;
                        variableMutationCounts.put(v.getKey(), variableMutationCounts.getOrDefault(v.getKey(), 0) + 1);
                    }
                }
            }
        }
        double variableMutationFrequency = executionSteps > 0 ? (double) totalMutations / executionSteps : 0;
        double loopControlMutations = 0;
        for (int m : variableMutationCounts.values()) {
            if (m > loopControlMutations) {
                loopControlMutations = m;
            }
        }

        // 4. Exception & Null access counts
        double exceptionCount = 0;
        double nullAccessCount = 0;

        for (TraceResponse.StepDto step : steps) {
            if ("EXCEPTION".equals(step.getEventType())) {
                exceptionCount++;
                String msg = step.getMessage() != null ? step.getMessage().toLowerCase() : "";
                if (msg.contains("nullpointer")) {
                    nullAccessCount += 1.0;
                } else if (msg.contains("arithmetic") || msg.contains("divide by zero")) {
                    arithmeticRiskCount += 1.0;
                }
            }
            if (step.getVariables() != null) {
                for (TraceResponse.VariableItemDto varDto : step.getVariables().values()) {
                    if ("null".equals(varDto.getValue())) {
                        nullAccessCount += 0.2;
                    }
                }
            }
        }

        if (executionResult != null && executionResult.getExceptionMessage() != null) {
            exceptionCount = Math.max(exceptionCount, 1.0);
            String exLower = executionResult.getExceptionMessage().toLowerCase();
            if (exLower.contains("nullpointer")) {
                nullAccessCount = Math.max(nullAccessCount, 1.0);
            } else if (exLower.contains("stackoverflow")) {
                recursionDepth = Math.max(recursionDepth, 50.0);
            } else if (exLower.contains("arithmetic") || exLower.contains("divide by zero") || exLower.contains("/ by zero")) {
                arithmeticRiskCount = Math.max(arithmeticRiskCount, 1.0);
            }
        }

        return new FeatureVectorDto(
                loopIterationCount,
                loopControlMutations,
                conditionRepeatCount,
                variableMutationFrequency,
                recursionDepth,
                methodCallCount,
                exceptionCount,
                nullAccessCount,
                executionSteps,
                executionDuration,
                syntaxErrorCount,
                typeMismatchCount,
                arithmeticRiskCount,
                resourceLeakCount,
                logicalBugCount,
                cyclomaticComplexity,
                codeLines
        );
    }

    public FeatureVectorDto extractFeatures(DebugService.DebugExecutionResult executionResult, TraceResponse traceResponse) {
        return extractFeatures(null, null, null, executionResult, traceResponse);
    }

    private int countOccurrences(String text, String target) {
        if (text == null || target == null || target.isEmpty()) return 0;
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(target, idx)) != -1) {
            count++;
            idx += target.length();
        }
        return count;
    }
}

