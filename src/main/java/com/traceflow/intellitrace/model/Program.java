package com.traceflow.intellitrace.model;

import java.util.ArrayList;

public class Program {
    private String fileName;
    private ArrayList<String> sourceCode;
    private ArrayList<Variable> variables;
    private ExecutionLog executionLog;

    public Program() {
        this.sourceCode = new ArrayList<>();
        this.variables = new ArrayList<>();
        this.executionLog = new ExecutionLog();
    }

    public Program(String fileName, ArrayList<String> sourceCode) {
        this.fileName = fileName;
        this.sourceCode = sourceCode != null ? sourceCode : new ArrayList<>();
        this.variables = new ArrayList<>();
        this.executionLog = new ExecutionLog();
    }

    public Program(String fileName, ArrayList<String> sourceCode, ArrayList<Variable> variables, ExecutionLog executionLog) {
        this.fileName = fileName;
        this.sourceCode = sourceCode != null ? sourceCode : new ArrayList<>();
        this.variables = variables != null ? variables : new ArrayList<>();
        this.executionLog = executionLog != null ? executionLog : new ExecutionLog();
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public ArrayList<String> getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(ArrayList<String> sourceCode) {
        this.sourceCode = sourceCode != null ? sourceCode : new ArrayList<>();
    }

    public ArrayList<Variable> getVariables() {
        return variables;
    }

    public void setVariables(ArrayList<Variable> variables) {
        this.variables = variables != null ? variables : new ArrayList<>();
    }

    public ExecutionLog getExecutionLog() {
        return executionLog;
    }

    public void setExecutionLog(ExecutionLog executionLog) {
        this.executionLog = executionLog != null ? executionLog : new ExecutionLog();
    }
}
