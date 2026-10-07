package com.traceflow.parser;

import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.stmt.*;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class AstAnalyzer {

    public static class MethodAstSummary {
        private String name;
        private int startLine;
        private int endLine;
        private int cyclomaticComplexity;
        private boolean isRecursive;
        private List<String> localVariables = new ArrayList<>();
        private List<String> methodCalls = new ArrayList<>();

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getStartLine() {
            return startLine;
        }

        public void setStartLine(int startLine) {
            this.startLine = startLine;
        }

        public int getEndLine() {
            return endLine;
        }

        public void setEndLine(int endLine) {
            this.endLine = endLine;
        }

        public int getCyclomaticComplexity() {
            return cyclomaticComplexity;
        }

        public void setCyclomaticComplexity(int cyclomaticComplexity) {
            this.cyclomaticComplexity = cyclomaticComplexity;
        }

        public boolean isRecursive() {
            return isRecursive;
        }

        public void setRecursive(boolean recursive) {
            isRecursive = recursive;
        }

        public List<String> getLocalVariables() {
            return localVariables;
        }

        public void setLocalVariables(List<String> localVariables) {
            this.localVariables = localVariables;
        }

        public List<String> getMethodCalls() {
            return methodCalls;
        }

        public void setMethodCalls(List<String> methodCalls) {
            this.methodCalls = methodCalls;
        }
    }

    public List<MethodAstSummary> analyzeMethods(CompilationUnit cu) {
        List<MethodAstSummary> summaries = new ArrayList<>();

        cu.findAll(MethodDeclaration.class).forEach(md -> {
            MethodAstSummary summary = new MethodAstSummary();
            summary.setName(md.getNameAsString());
            summary.setStartLine(md.getBegin().map(p -> p.line).orElse(0));
            summary.setEndLine(md.getEnd().map(p -> p.line).orElse(0));

            // Complexity calculation: 1 + number of if/while/for/catch/case
            int complexity = 1;
            complexity += md.findAll(IfStmt.class).size();
            complexity += md.findAll(WhileStmt.class).size();
            complexity += md.findAll(ForStmt.class).size();
            complexity += md.findAll(ForEachStmt.class).size();
            complexity += md.findAll(DoStmt.class).size();
            complexity += md.findAll(CatchClause.class).size();
            complexity += md.findAll(SwitchEntry.class).stream().filter(se -> !se.getLabels().isEmpty()).count();
            summary.setCyclomaticComplexity(complexity);

            // Local variables
            md.findAll(VariableDeclarator.class).forEach(vd -> summary.getLocalVariables().add(vd.getNameAsString()));

            // Method calls and recursion
            boolean recursive = false;
            for (MethodCallExpr mce : md.findAll(MethodCallExpr.class)) {
                String callName = mce.getNameAsString();
                summary.getMethodCalls().add(callName);
                if (callName.equals(md.getNameAsString())) {
                    recursive = true;
                }
            }
            summary.setRecursive(recursive);
            summaries.add(summary);
        });

        return summaries;
    }
}
