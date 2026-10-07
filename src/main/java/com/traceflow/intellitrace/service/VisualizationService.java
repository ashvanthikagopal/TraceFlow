package com.traceflow.intellitrace.service;

import com.traceflow.intellitrace.model.ExecutionStep;
import com.traceflow.intellitrace.model.Program;
import com.traceflow.intellitrace.model.Variable;

import java.util.ArrayList;

public class VisualizationService {

    public void printVariableTable(Program program) {
        if (program == null || program.getVariables() == null || program.getVariables().isEmpty()) {
            System.out.println("[Visualization] No variables found in current program. Please execute first (Option 3).");
            return;
        }

        ArrayList<Variable> variables = program.getVariables();

        int maxNameLen = Math.max(15, "Variable Name".length());
        int maxTypeLen = Math.max(10, "Data Type".length());
        int maxValLen = Math.max(20, "Evaluated Value".length());
        int maxLineLen = Math.max(8, "Line No".length());

        for (Variable v : variables) {
            if (v.getName() != null) maxNameLen = Math.max(maxNameLen, v.getName().length());
            if (v.getType() != null) maxTypeLen = Math.max(maxTypeLen, v.getType().length());
            if (v.getValue() != null) maxValLen = Math.max(maxValLen, v.getValue().length());
        }

        int totalWidth = maxNameLen + maxTypeLen + maxValLen + maxLineLen + 13;
        String lineSeparator = "+" + "-".repeat(maxNameLen + 2) + "+" + "-".repeat(maxTypeLen + 2)
                + "+" + "-".repeat(maxValLen + 2) + "+" + "-".repeat(maxLineLen + 2) + "+";

        System.out.println("=".repeat(totalWidth));
        System.out.println("                         INTELLITRACE VARIABLE TABLE                             ");
        System.out.println("=".repeat(totalWidth));
        System.out.println(lineSeparator);
        System.out.printf("| %-" + maxNameLen + "s | %-" + maxTypeLen + "s | %-" + maxValLen + "s | %-" + maxLineLen + "s |%n",
                "Variable Name", "Data Type", "Evaluated Value", "Line No");
        System.out.println(lineSeparator);

        for (Variable v : variables) {
            System.out.printf("| %-" + maxNameLen + "s | %-" + maxTypeLen + "s | %-" + maxValLen + "s | Line %-" + (maxLineLen - 5) + "d |%n",
                    v.getName() != null ? v.getName() : "",
                    v.getType() != null ? v.getType() : "",
                    v.getValue() != null ? v.getValue() : "",
                    v.getLineNumber());
        }
        System.out.println(lineSeparator);
        System.out.printf("Total Tracked Variables: %d%n", variables.size());
        System.out.println("=".repeat(totalWidth));
    }

    public void printTimeline(Program program) {
        if (program == null || program.getExecutionLog() == null || program.getExecutionLog().getSteps().isEmpty()) {
            System.out.println("[Visualization] No execution steps found. Please execute first (Option 3).");
            return;
        }

        ArrayList<ExecutionStep> steps = program.getExecutionLog().getSteps();

        System.out.println("=========================================================================================");
        System.out.println("                        INTELLITRACE EXECUTION TIMELINE                                 ");
        System.out.println("=========================================================================================");
        System.out.printf("%-8s | %-8s | %-22s | %-28s | %s%n",
                "Step #", "Line #", "Category", "Source Code", "Execution Meaning");
        System.out.println("-".repeat(89));

        for (ExecutionStep step : steps) {
            String shortCode = step.getCode();
            if (shortCode != null && shortCode.length() > 26) {
                shortCode = shortCode.substring(0, 23) + "...";
            }
            System.out.printf("Step %-3d | Line %-3d | [%-20s] | %-28s | %s%n",
                    step.getStepNumber(),
                    step.getLineNumber(),
                    step.getCategory() != null ? step.getCategory() : "Statement",
                    shortCode != null ? shortCode : "",
                    step.getDescription() != null ? step.getDescription() : "");
        }

        System.out.println("=========================================================================================");
        System.out.printf("Total Execution Steps: %d%n", steps.size());
        System.out.println("=========================================================================================");
    }
}
