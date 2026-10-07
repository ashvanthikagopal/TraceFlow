package com.traceflow.service;

import com.traceflow.intellitrace.model.ExecutionStep;
import com.traceflow.intellitrace.model.Variable;
import com.traceflow.intellitrace.parser.CodeParser;
import com.traceflow.source.dto.IntelliTraceResponse;
import com.traceflow.source.dto.TraceResponse;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class IntelliTraceBridgeService {

    private final CodeParser codeParser;
    private final TraceService traceService;

    public IntelliTraceBridgeService(TraceService traceService) {
        this.codeParser = new CodeParser();
        this.traceService = traceService;
    }

    public IntelliTraceResponse analyzeSourceCode(String sourceCode, String fileName) {
        if (sourceCode == null) {
            sourceCode = "";
        }
        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = "Sample.java";
        }

        String[] rawLines = sourceCode.split("\\r?\\n");
        ArrayList<String> lines = new ArrayList<>(Arrays.asList(rawLines));

        ArrayList<Variable> variables = codeParser.parseVariables(lines);
        ArrayList<ExecutionStep> steps = codeParser.generateTimeline(lines);

        List<IntelliTraceResponse.VariableDto> varDtos = new ArrayList<>();
        for (Variable v : variables) {
            varDtos.add(new IntelliTraceResponse.VariableDto(
                    v.getName(),
                    v.getType(),
                    v.getValue(),
                    v.getLineNumber()
            ));
        }

        int controlFlowCount = 0;
        int outputCount = 0;

        List<IntelliTraceResponse.StepDto> stepDtos = new ArrayList<>();
        for (ExecutionStep s : steps) {
            stepDtos.add(new IntelliTraceResponse.StepDto(
                    s.getStepNumber(),
                    s.getLineNumber(),
                    s.getCode(),
                    s.getDescription(),
                    s.getCategory()
            ));

            if ("If Condition".equals(s.getCategory()) || "For Loop".equals(s.getCategory()) || "While Loop".equals(s.getCategory())) {
                controlFlowCount++;
            } else if ("Output Statement".equals(s.getCategory())) {
                outputCount++;
            }
        }

        IntelliTraceResponse.SummaryDto summary = new IntelliTraceResponse.SummaryDto(
                varDtos.size(),
                stepDtos.size(),
                controlFlowCount,
                outputCount
        );

        return new IntelliTraceResponse(fileName, lines.size(), varDtos, stepDtos, summary);
    }

    public byte[] exportTraceToCsv(Long analysisId) {
        TraceResponse traceResponse = traceService.getTraceByAnalysisId(analysisId);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8)) {
            writer.println("StepNumber,LineNumber,EventType,MethodName,Message,VariablesState");

            if (traceResponse != null && traceResponse.getSteps() != null) {
                for (TraceResponse.StepDto step : traceResponse.getSteps()) {
                    StringBuilder varsBuilder = new StringBuilder();
                    if (step.getVariables() != null) {
                        for (Map.Entry<String, TraceResponse.VariableItemDto> entry : step.getVariables().entrySet()) {
                            if (varsBuilder.length() > 0) varsBuilder.append("; ");
                            varsBuilder.append(entry.getKey()).append("=").append(entry.getValue().getValue());
                        }
                    }

                    writer.printf("%d,%d,\"%s\",\"%s\",\"%s\",\"%s\"%n",
                            step.getStepNo(),
                            step.getLineNo(),
                            escapeCsv(step.getEventType()),
                            escapeCsv(step.getMethodName()),
                            escapeCsv(step.getMessage()),
                            escapeCsv(varsBuilder.toString())
                    );
                }
            }
        }
        return baos.toByteArray();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return val.replace("\"", "\"\"");
    }
}
