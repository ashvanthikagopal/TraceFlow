package com.traceflow.parser;

import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.ConstructorDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.stmt.*;
import com.traceflow.source.dto.FlowGraphDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ControlFlowAnalyzer {

    public FlowGraphDto buildFlowGraph(CompilationUnit cu) {
        return buildFlowGraph(cu, null);
    }

    public FlowGraphDto buildFlowGraph(CompilationUnit cu, String fallbackSourceCode) {
        List<FlowGraphDto.FlowNode> nodes = new ArrayList<>();
        List<FlowGraphDto.FlowEdge> edges = new ArrayList<>();
        AtomicInteger idGen = new AtomicInteger(1);

        if (cu != null) {
            // 1. Process Constructors
            for (ConstructorDeclaration cd : cu.findAll(ConstructorDeclaration.class)) {
                buildConstructorFlow(cd, nodes, edges, idGen);
            }

            // 2. Process Methods
            for (MethodDeclaration md : cu.findAll(MethodDeclaration.class)) {
                buildMethodFlow(md, nodes, edges, idGen);
            }
        }

        // 3. If no nodes were produced (AST failed or empty), build fallback from raw source code
        if (nodes.isEmpty() && fallbackSourceCode != null && !fallbackSourceCode.trim().isEmpty()) {
            buildFallbackFlowGraph(fallbackSourceCode, nodes, edges, idGen);
        }

        return new FlowGraphDto(nodes, edges);
    }

    private void buildConstructorFlow(ConstructorDeclaration cd, List<FlowGraphDto.FlowNode> nodes, List<FlowGraphDto.FlowEdge> edges, AtomicInteger idGen) {
        String name = cd.getNameAsString();
        int startLine = cd.getBegin().map(p -> p.line).orElse(1);

        String startId = "node_" + idGen.getAndIncrement();
        nodes.add(new FlowGraphDto.FlowNode(startId, "Constructor: " + name + "()", "START", startLine, cd.getDeclarationAsString(false, false, false), name));

        int endLine = cd.getEnd().map(p -> p.line).orElse(startLine);
        String endId = "node_" + idGen.getAndIncrement();

        BlockStmt body = cd.getBody();
        String currentSource = startId;

        if (body != null) {
            currentSource = processBlock(body, currentSource, endId, name, nodes, edges, idGen);
        }

        nodes.add(new FlowGraphDto.FlowNode(endId, "End: " + name + "()", "END", endLine, "}", name));

        if (currentSource != null && !currentSource.equals(endId)) {
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, endId, "next", "straight"));
        }
    }

    private void buildMethodFlow(MethodDeclaration md, List<FlowGraphDto.FlowNode> nodes, List<FlowGraphDto.FlowEdge> edges, AtomicInteger idGen) {
        String methodName = md.getNameAsString();
        int startLine = md.getBegin().map(p -> p.line).orElse(1);

        String startId = "node_" + idGen.getAndIncrement();
        nodes.add(new FlowGraphDto.FlowNode(startId, "Start: " + methodName + "()", "START", startLine, md.getDeclarationAsString(false, false, false), methodName));

        int endLine = md.getEnd().map(p -> p.line).orElse(startLine);
        String endId = "node_" + idGen.getAndIncrement();

        if (md.getBody().isEmpty()) {
            nodes.add(new FlowGraphDto.FlowNode(endId, "End: " + methodName, "END", endLine, "}", methodName));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), startId, endId, "direct", "straight"));
            return;
        }

        BlockStmt body = md.getBody().get();
        String currentSource = startId;

        currentSource = processBlock(body, currentSource, endId, methodName, nodes, edges, idGen);

        nodes.add(new FlowGraphDto.FlowNode(endId, "End: " + methodName, "END", endLine, "}", methodName));

        if (currentSource != null && !currentSource.equals(endId)) {
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, endId, "next", "straight"));
        }
    }

    private String processBlock(BlockStmt block, String currentSource, String endId, String methodName,
                                List<FlowGraphDto.FlowNode> nodes, List<FlowGraphDto.FlowEdge> edges, AtomicInteger idGen) {
        for (Statement stmt : block.getStatements()) {
            if (currentSource == null) break;
            currentSource = processStatement(stmt, currentSource, endId, methodName, nodes, edges, idGen);
        }
        return currentSource;
    }

    private String processStatement(Statement stmt, String currentSource, String endId, String methodName,
                                    List<FlowGraphDto.FlowNode> nodes, List<FlowGraphDto.FlowEdge> edges, AtomicInteger idGen) {
        int lineNo = stmt.getBegin().map(p -> p.line).orElse(0);
        String snippet = truncateSnippet(stmt.toString());

        if (stmt.isIfStmt()) {
            IfStmt ifStmt = stmt.asIfStmt();
            String ifId = "node_" + idGen.getAndIncrement();
            String condSnippet = ifStmt.getCondition().toString();
            nodes.add(new FlowGraphDto.FlowNode(ifId, "if (" + condSnippet + ")", "IF_DECISION", lineNo, condSnippet, methodName));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, ifId, "next", "straight"));

            // Then branch
            String thenStart = ifId;
            String thenEnd;
            if (ifStmt.getThenStmt().isBlockStmt()) {
                thenEnd = processBlock(ifStmt.getThenStmt().asBlockStmt(), thenStart, endId, methodName, nodes, edges, idGen);
            } else {
                thenEnd = processStatement(ifStmt.getThenStmt(), thenStart, endId, methodName, nodes, edges, idGen);
            }

            // Else branch
            String elseEnd = null;
            if (ifStmt.getElseStmt().isPresent()) {
                Statement elseStmt = ifStmt.getElseStmt().get();
                if (elseStmt.isBlockStmt()) {
                    elseEnd = processBlock(elseStmt.asBlockStmt(), ifId, endId, methodName, nodes, edges, idGen);
                } else {
                    elseEnd = processStatement(elseStmt, ifId, endId, methodName, nodes, edges, idGen);
                }
            }

            // Merge node
            String mergeId = "node_" + idGen.getAndIncrement();
            nodes.add(new FlowGraphDto.FlowNode(mergeId, "Join", "STATEMENT", lineNo, "// join", methodName));

            if (thenEnd != null) {
                edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), thenEnd, mergeId, "then_done", "straight"));
            }
            if (elseEnd != null) {
                edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), elseEnd, mergeId, "else_done", "straight"));
            } else {
                edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), ifId, mergeId, "false", "branch_no"));
            }

            return mergeId;
        } else if (stmt.isWhileStmt()) {
            WhileStmt whileStmt = stmt.asWhileStmt();
            String loopId = "node_" + idGen.getAndIncrement();
            String cond = whileStmt.getCondition().toString();
            nodes.add(new FlowGraphDto.FlowNode(loopId, "while (" + cond + ")", "LOOP_CONDITION", lineNo, cond, methodName));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, loopId, "enter_loop", "straight"));

            String bodyEnd;
            if (whileStmt.getBody().isBlockStmt()) {
                bodyEnd = processBlock(whileStmt.getBody().asBlockStmt(), loopId, endId, methodName, nodes, edges, idGen);
            } else {
                bodyEnd = processStatement(whileStmt.getBody(), loopId, endId, methodName, nodes, edges, idGen);
            }

            if (bodyEnd != null) {
                edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), bodyEnd, loopId, "repeat", "loop_back"));
            }

            String afterLoopId = "node_" + idGen.getAndIncrement();
            nodes.add(new FlowGraphDto.FlowNode(afterLoopId, "Exit While Loop", "STATEMENT", lineNo, "// exit loop", methodName));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), loopId, afterLoopId, "false", "branch_no"));

            return afterLoopId;
        } else if (stmt.isForStmt()) {
            ForStmt forStmt = stmt.asForStmt();
            String loopId = "node_" + idGen.getAndIncrement();
            String comp = forStmt.getCompare().map(Node::toString).orElse("true");
            nodes.add(new FlowGraphDto.FlowNode(loopId, "for (" + comp + ")", "LOOP_CONDITION", lineNo, comp, methodName));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, loopId, "enter_for", "straight"));

            String bodyEnd;
            if (forStmt.getBody().isBlockStmt()) {
                bodyEnd = processBlock(forStmt.getBody().asBlockStmt(), loopId, endId, methodName, nodes, edges, idGen);
            } else {
                bodyEnd = processStatement(forStmt.getBody(), loopId, endId, methodName, nodes, edges, idGen);
            }

            if (bodyEnd != null) {
                edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), bodyEnd, loopId, "next_iteration", "loop_back"));
            }

            String afterLoopId = "node_" + idGen.getAndIncrement();
            nodes.add(new FlowGraphDto.FlowNode(afterLoopId, "Exit For Loop", "STATEMENT", lineNo, "// exit for", methodName));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), loopId, afterLoopId, "done", "branch_no"));

            return afterLoopId;
        } else if (stmt.isReturnStmt()) {
            String retId = "node_" + idGen.getAndIncrement();
            nodes.add(new FlowGraphDto.FlowNode(retId, "return " + stmt.asReturnStmt().getExpression().map(Object::toString).orElse(""), "RETURN", lineNo, snippet, methodName));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, retId, "return", "straight"));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), retId, endId, "exit", "straight"));
            return null;
        } else if (stmt.isThrowStmt()) {
            String throwId = "node_" + idGen.getAndIncrement();
            nodes.add(new FlowGraphDto.FlowNode(throwId, "throw " + stmt.asThrowStmt().getExpression(), "EXCEPTION", lineNo, snippet, methodName));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, throwId, "throw", "straight"));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), throwId, endId, "abort", "straight"));
            return null;
        } else {
            String stmtId = "node_" + idGen.getAndIncrement();
            String type = snippet.contains("(") && snippet.contains(")") ? "METHOD_CALL" : "STATEMENT";
            nodes.add(new FlowGraphDto.FlowNode(stmtId, snippet, type, lineNo, snippet, methodName));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, stmtId, "next", "straight"));
            return stmtId;
        }
    }

    private void buildFallbackFlowGraph(String sourceCode, List<FlowGraphDto.FlowNode> nodes, List<FlowGraphDto.FlowEdge> edges, AtomicInteger idGen) {
        String[] lines = sourceCode.split("\\r?\\n");
        String currentMethod = "main";
        String currentSource = null;
        String methodEndId = null;

        Pattern methodPattern = Pattern.compile("^\\s*(?:public|private|protected|static|final|\\s)*\\s*(?:[A-Za-z0-9_<>\\[\\]]+\\s+)?([A-Za-z0-9_]+)\\s*\\((.*)\\)\\s*\\{?\\s*$");

        for (int i = 0; i < lines.length; i++) {
            int lineNo = i + 1;
            String line = lines[i].trim();
            if (line.isEmpty() || line.startsWith("//") || line.startsWith("import ") || line.startsWith("package ")) continue;

            if (line.startsWith("class ") || line.startsWith("public class ")) {
                continue;
            }

            Matcher m = methodPattern.matcher(line);
            if (m.find() && !line.startsWith("if") && !line.startsWith("for") && !line.startsWith("while") && !line.startsWith("return") && !line.contains("System.out")) {
                String methodName = m.group(1);
                if (currentSource != null && methodEndId != null) {
                    nodes.add(new FlowGraphDto.FlowNode(methodEndId, "End: " + currentMethod, "END", lineNo - 1, "}", currentMethod));
                    edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, methodEndId, "end", "straight"));
                }

                currentMethod = methodName;
                String startId = "node_" + idGen.getAndIncrement();
                methodEndId = "node_" + idGen.getAndIncrement();
                nodes.add(new FlowGraphDto.FlowNode(startId, "Start: " + methodName + "()", "START", lineNo, line, methodName));
                currentSource = startId;
                continue;
            }

            if (currentSource == null) {
                String startId = "node_" + idGen.getAndIncrement();
                methodEndId = "node_" + idGen.getAndIncrement();
                nodes.add(new FlowGraphDto.FlowNode(startId, "Start: " + currentMethod + "()", "START", lineNo, "// start", currentMethod));
                currentSource = startId;
            }

            String nodeId = "node_" + idGen.getAndIncrement();
            String type = "STATEMENT";
            if (line.startsWith("if")) type = "IF_DECISION";
            else if (line.startsWith("for") || line.startsWith("while")) type = "LOOP_CONDITION";
            else if (line.startsWith("return")) type = "RETURN";
            else if (line.contains("(") && line.contains(")")) type = "METHOD_CALL";

            nodes.add(new FlowGraphDto.FlowNode(nodeId, truncateSnippet(line), type, lineNo, line, currentMethod));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, nodeId, "next", "straight"));
            currentSource = nodeId;
        }

        if (currentSource != null && methodEndId != null) {
            nodes.add(new FlowGraphDto.FlowNode(methodEndId, "End: " + currentMethod, "END", lines.length, "}", currentMethod));
            edges.add(new FlowGraphDto.FlowEdge("edge_" + idGen.getAndIncrement(), currentSource, methodEndId, "end", "straight"));
        }
    }

    private String truncateSnippet(String code) {
        if (code == null) return "";
        String clean = code.trim().replaceAll("\\s+", " ");
        if (clean.length() > 40) {
            return clean.substring(0, 37) + "...";
        }
        return clean;
    }
}
