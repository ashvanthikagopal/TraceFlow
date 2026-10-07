package com.traceflow.source.dto;

import java.util.ArrayList;
import java.util.List;

public class IntelliTraceResponse {
    private String fileName;
    private int totalLines;
    private List<VariableDto> variables;
    private List<StepDto> steps;
    private SummaryDto summary;

    public IntelliTraceResponse() {
        this.variables = new ArrayList<>();
        this.steps = new ArrayList<>();
    }

    public IntelliTraceResponse(String fileName, int totalLines, List<VariableDto> variables, List<StepDto> steps, SummaryDto summary) {
        this.fileName = fileName;
        this.totalLines = totalLines;
        this.variables = variables != null ? variables : new ArrayList<>();
        this.steps = steps != null ? steps : new ArrayList<>();
        this.summary = summary;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public int getTotalLines() {
        return totalLines;
    }

    public void setTotalLines(int totalLines) {
        this.totalLines = totalLines;
    }

    public List<VariableDto> getVariables() {
        return variables;
    }

    public void setVariables(List<VariableDto> variables) {
        this.variables = variables;
    }

    public List<StepDto> getSteps() {
        return steps;
    }

    public void setSteps(List<StepDto> steps) {
        this.steps = steps;
    }

    public SummaryDto getSummary() {
        return summary;
    }

    public void setSummary(SummaryDto summary) {
        this.summary = summary;
    }

    public static class VariableDto {
        private String name;
        private String type;
        private String value;
        private int lineNumber;

        public VariableDto() {}

        public VariableDto(String name, String type, String value, int lineNumber) {
            this.name = name;
            this.type = type;
            this.value = value;
            this.lineNumber = lineNumber;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public int getLineNumber() {
            return lineNumber;
        }

        public void setLineNumber(int lineNumber) {
            this.lineNumber = lineNumber;
        }
    }

    public static class StepDto {
        private int stepNumber;
        private int lineNumber;
        private String code;
        private String description;
        private String category;

        public StepDto() {}

        public StepDto(int stepNumber, int lineNumber, String code, String description, String category) {
            this.stepNumber = stepNumber;
            this.lineNumber = lineNumber;
            this.code = code;
            this.description = description;
            this.category = category;
        }

        public int getStepNumber() {
            return stepNumber;
        }

        public void setStepNumber(int stepNumber) {
            this.stepNumber = stepNumber;
        }

        public int getLineNumber() {
            return lineNumber;
        }

        public void setLineNumber(int lineNumber) {
            this.lineNumber = lineNumber;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }
    }

    public static class SummaryDto {
        private int totalVariables;
        private int totalSteps;
        private int controlFlowStatements;
        private int outputStatements;

        public SummaryDto() {}

        public SummaryDto(int totalVariables, int totalSteps, int controlFlowStatements, int outputStatements) {
            this.totalVariables = totalVariables;
            this.totalSteps = totalSteps;
            this.controlFlowStatements = controlFlowStatements;
            this.outputStatements = outputStatements;
        }

        public int getTotalVariables() {
            return totalVariables;
        }

        public void setTotalVariables(int totalVariables) {
            this.totalVariables = totalVariables;
        }

        public int getTotalSteps() {
            return totalSteps;
        }

        public void setTotalSteps(int totalSteps) {
            this.totalSteps = totalSteps;
        }

        public int getControlFlowStatements() {
            return controlFlowStatements;
        }

        public void setControlFlowStatements(int controlFlowStatements) {
            this.controlFlowStatements = controlFlowStatements;
        }

        public int getOutputStatements() {
            return outputStatements;
        }

        public void setOutputStatements(int outputStatements) {
            this.outputStatements = outputStatements;
        }
    }
}
