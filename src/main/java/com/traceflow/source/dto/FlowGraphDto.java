package com.traceflow.source.dto;

import java.util.ArrayList;
import java.util.List;

public class FlowGraphDto {

    public static class FlowNode {
        private String id;
        private String label;
        private String type; // START, END, STATEMENT, IF_DECISION, LOOP_CONDITION, METHOD_CALL, RETURN, EXCEPTION
        private Integer lineNo;
        private String codeSnippet;
        private String method;

        public FlowNode() {}

        public FlowNode(String id, String label, String type, Integer lineNo, String codeSnippet, String method) {
            this.id = id;
            this.label = label;
            this.type = type;
            this.lineNo = lineNo;
            this.codeSnippet = codeSnippet;
            this.method = method;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Integer getLineNo() {
            return lineNo;
        }

        public void setLineNo(Integer lineNo) {
            this.lineNo = lineNo;
        }

        public String getCodeSnippet() {
            return codeSnippet;
        }

        public void setCodeSnippet(String codeSnippet) {
            this.codeSnippet = codeSnippet;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }
    }

    public static class FlowEdge {
        private String id;
        private String source;
        private String target;
        private String label; // "yes", "no", "loop", "next", "call", "return"
        private String type;

        public FlowEdge() {}

        public FlowEdge(String id, String source, String target, String label, String type) {
            this.id = id;
            this.source = source;
            this.target = target;
            this.label = label;
            this.type = type;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public String getTarget() {
            return target;
        }

        public void setTarget(String target) {
            this.target = target;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }

    private List<FlowNode> nodes = new ArrayList<>();
    private List<FlowEdge> edges = new ArrayList<>();

    public FlowGraphDto() {}

    public FlowGraphDto(List<FlowNode> nodes, List<FlowEdge> edges) {
        this.nodes = nodes != null ? nodes : new ArrayList<>();
        this.edges = edges != null ? edges : new ArrayList<>();
    }

    public List<FlowNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<FlowNode> nodes) {
        this.nodes = nodes;
    }

    public List<FlowEdge> getEdges() {
        return edges;
    }

    public void setEdges(List<FlowEdge> edges) {
        this.edges = edges;
    }
}
