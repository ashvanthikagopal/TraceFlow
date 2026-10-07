package com.traceflow.intellitrace.model;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;

public class ExecutionLog {
    private ArrayList<ExecutionStep> steps;

    public ExecutionLog() {
        this.steps = new ArrayList<>();
    }

    public ExecutionLog(ArrayList<ExecutionStep> steps) {
        this.steps = steps != null ? steps : new ArrayList<>();
    }

    public ArrayList<ExecutionStep> getSteps() {
        return steps;
    }

    public void setSteps(ArrayList<ExecutionStep> steps) {
        this.steps = steps != null ? steps : new ArrayList<>();
    }

    public void addStep(ExecutionStep step) {
        if (this.steps == null) {
            this.steps = new ArrayList<>();
        }
        this.steps.add(step);
    }

    public int size() {
        return steps != null ? steps.size() : 0;
    }

    public void clear() {
        if (steps != null) {
            steps.clear();
        }
    }

    public boolean saveToCsv(File file) {
        if (file == null) {
            return false;
        }
        try {
            File parent = file.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
                writer.write("StepNumber,LineNumber,Category,Code,Description");
                writer.newLine();
                for (ExecutionStep step : steps) {
                    String escapedCode = escapeCsv(step.getCode());
                    String escapedDesc = escapeCsv(step.getDescription());
                    String escapedCategory = escapeCsv(step.getCategory());
                    writer.write(String.format("%d,%d,\"%s\",\"%s\",\"%s\"",
                            step.getStepNumber(),
                            step.getLineNumber(),
                            escapedCategory,
                            escapedCode,
                            escapedDesc));
                    writer.newLine();
                }
            }
            return true;
        } catch (IOException e) {
            System.out.println("Error saving execution log to CSV: " + e.getMessage());
            return false;
        }
    }

    public boolean saveToFile(File file) {
        if (file == null) {
            return false;
        }
        try {
            File parent = file.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
                writer.write("=========================================================================================");
                writer.newLine();
                writer.write("                              INTELLITRACE EXECUTION LOG                                ");
                writer.newLine();
                writer.write("=========================================================================================");
                writer.newLine();
                for (ExecutionStep step : steps) {
                    writer.write(step.toString());
                    writer.newLine();
                }
                writer.write("=========================================================================================");
                writer.newLine();
                writer.write("Total Steps Recorded: " + steps.size());
                writer.newLine();
            }
            return true;
        } catch (IOException e) {
            System.out.println("Error saving execution log to file: " + e.getMessage());
            return false;
        }
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        return input.replace("\"", "\"\"");
    }
}
