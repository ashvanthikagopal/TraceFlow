package com.traceflow.intellitrace.model;

public class Variable {
    private String name;
    private String type;
    private String value;
    private int lineNumber;

    public Variable() {
    }

    public Variable(String name, String type, String value) {
        this.name = name;
        this.type = type;
        this.value = value;
        this.lineNumber = 0;
    }

    public Variable(String name, String type, String value, int lineNumber) {
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

    @Override
    public String toString() {
        return String.format("| %-18s | %-12s | %-24s | Line %-4d |",
                name != null ? name : "",
                type != null ? type : "",
                value != null ? value : "",
                lineNumber);
    }
}
