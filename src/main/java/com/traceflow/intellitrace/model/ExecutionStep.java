package com.traceflow.intellitrace.model;

public class ExecutionStep {
    private int stepNumber;
    private int lineNumber;
    private String code;
    private String description;
    private String category;

    public ExecutionStep() {
    }

    public ExecutionStep(int stepNumber, int lineNumber, String code, String description) {
        this.stepNumber = stepNumber;
        this.lineNumber = lineNumber;
        this.code = code;
        this.description = description;
        this.category = "Statement";
    }

    public ExecutionStep(int stepNumber, int lineNumber, String code, String description, String category) {
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

    @Override
    public String toString() {
        return String.format("Step %-3d | Line %-3d | [%-20s] | %-35s | %s",
                stepNumber, lineNumber, category, code, description);
    }
}
