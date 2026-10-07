package com.traceflow.intellitrace.service;

import com.traceflow.intellitrace.model.ExecutionLog;
import com.traceflow.intellitrace.model.ExecutionStep;
import com.traceflow.intellitrace.model.Program;
import com.traceflow.intellitrace.model.Variable;
import com.traceflow.intellitrace.parser.CodeParser;

import java.util.ArrayList;

public class ExecutionEngine {

    private final CodeParser parser;

    public ExecutionEngine() {
        this.parser = new CodeParser();
    }

    public ExecutionEngine(CodeParser parser) {
        this.parser = parser != null ? parser : new CodeParser();
    }

    public void execute(Program program) {
        if (program == null || program.getSourceCode() == null || program.getSourceCode().isEmpty()) {
            System.out.println("[ExecutionEngine] No source code available to execute.");
            return;
        }

        System.out.println("=========================================================================================");
        System.out.println("                        INTELLITRACE STATIC EXECUTION ENGINE                            ");
        System.out.println("=========================================================================================");
        System.out.println("Analyzing file: " + (program.getFileName() != null ? program.getFileName() : "Unknown.java"));
        System.out.println("Total lines of source code: " + program.getSourceCode().size());

        // Parse variables with expression evaluation
        ArrayList<Variable> variables = parser.parseVariables(program.getSourceCode());
        program.setVariables(variables);

        // Generate categorized execution timeline
        ArrayList<ExecutionStep> steps = parser.generateTimeline(program.getSourceCode());
        program.setExecutionLog(new ExecutionLog(steps));

        System.out.printf("Static Analysis complete: %d variables identified and evaluated, %d execution steps mapped.%n",
                variables.size(), steps.size());
        System.out.println("=========================================================================================");
    }
}
