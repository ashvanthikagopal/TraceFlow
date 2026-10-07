package com.traceflow.source.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AnalysisResponse {

    public static class BugPredictionDto {
        private String bugType; // NORMAL, INFINITE_LOOP, OFF_BY_ONE, NULL_POINTER, RECURSION_RISK, ARITHMETIC_ERROR, COMPILATION_ERROR, TYPE_MISMATCH, RESOURCE_LEAK, LOGICAL_BUG
        private Double confidence;
        private String explanation;
        private String mlModelName; // e.g. "Weka J48 Decision Tree (C4.5 Offline)"
        private String decisionPath; // Weka decision rule / feature path
        private FeatureVectorDto features;

        public BugPredictionDto() {}

        public BugPredictionDto(String bugType, Double confidence, String explanation, FeatureVectorDto features) {
            this(bugType, confidence, explanation, "Weka J48 Decision Tree (Offline)", "Feature threshold branch evaluation", features);
        }

        public BugPredictionDto(String bugType, Double confidence, String explanation, String mlModelName, String decisionPath, FeatureVectorDto features) {
            this.bugType = bugType;
            this.confidence = confidence;
            this.explanation = explanation;
            this.mlModelName = mlModelName;
            this.decisionPath = decisionPath;
            this.features = features;
        }

        public String getBugType() {
            return bugType;
        }

        public void setBugType(String bugType) {
            this.bugType = bugType;
        }

        public Double getConfidence() {
            return confidence;
        }

        public void setConfidence(Double confidence) {
            this.confidence = confidence;
        }

        public String getExplanation() {
            return explanation;
        }

        public void setExplanation(String explanation) {
            this.explanation = explanation;
        }

        public String getMlModelName() {
            return mlModelName;
        }

        public void setMlModelName(String mlModelName) {
            this.mlModelName = mlModelName;
        }

        public String getDecisionPath() {
            return decisionPath;
        }

        public void setDecisionPath(String decisionPath) {
            this.decisionPath = decisionPath;
        }

        public FeatureVectorDto getFeatures() {
            return features;
        }

        public void setFeatures(FeatureVectorDto features) {
            this.features = features;
        }
    }

    public static class ExplanationDto {
        private String summary;
        private String detailedBehavior;
        private List<String> keyObservations;
        private List<String> suggestions;
        private String fixedCode;
        private String bugRiskLevel; // SAFE, LOW, MEDIUM, HIGH, CRITICAL

        public ExplanationDto() {}

        public ExplanationDto(String summary, String detailedBehavior, List<String> keyObservations, List<String> suggestions, String bugRiskLevel) {
            this(summary, detailedBehavior, keyObservations, suggestions, null, bugRiskLevel);
        }

        public ExplanationDto(String summary, String detailedBehavior, List<String> keyObservations, List<String> suggestions, String fixedCode, String bugRiskLevel) {
            this.summary = summary;
            this.detailedBehavior = detailedBehavior;
            this.keyObservations = keyObservations;
            this.suggestions = suggestions;
            this.fixedCode = fixedCode;
            this.bugRiskLevel = bugRiskLevel;
        }

        public String getSummary() {
            return summary;
        }

        public void setSummary(String summary) {
            this.summary = summary;
        }

        public String getDetailedBehavior() {
            return detailedBehavior;
        }

        public void setDetailedBehavior(String detailedBehavior) {
            this.detailedBehavior = detailedBehavior;
        }

        public List<String> getKeyObservations() {
            return keyObservations;
        }

        public void setKeyObservations(List<String> keyObservations) {
            this.keyObservations = keyObservations;
        }

        public List<String> getSuggestions() {
            return suggestions;
        }

        public void setSuggestions(List<String> suggestions) {
            this.suggestions = suggestions;
        }

        public String getFixedCode() {
            return fixedCode;
        }

        public void setFixedCode(String fixedCode) {
            this.fixedCode = fixedCode;
        }

        public String getBugRiskLevel() {
            return bugRiskLevel;
        }

        public void setBugRiskLevel(String bugRiskLevel) {
            this.bugRiskLevel = bugRiskLevel;
        }
    }

    private Long id;
    private Long projectId;
    private String projectName;
    private String sourceCode;
    private String status;
    private Integer errorCount;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    private List<StaticIssueDto> staticIssues;
    private List<CompilerDiagnosticDto> compilerDiagnostics;
    private FlowGraphDto flowGraph;
    private TraceResponse traceResponse;
    private BugPredictionDto bugPrediction;
    private ExplanationDto explanation;

    public AnalysisResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(Integer errorCount) {
        this.errorCount = errorCount;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public List<StaticIssueDto> getStaticIssues() {
        return staticIssues;
    }

    public void setStaticIssues(List<StaticIssueDto> staticIssues) {
        this.staticIssues = staticIssues;
    }

    public List<CompilerDiagnosticDto> getCompilerDiagnostics() {
        return compilerDiagnostics;
    }

    public void setCompilerDiagnostics(List<CompilerDiagnosticDto> compilerDiagnostics) {
        this.compilerDiagnostics = compilerDiagnostics;
    }

    public FlowGraphDto getFlowGraph() {
        return flowGraph;
    }

    public void setFlowGraph(FlowGraphDto flowGraph) {
        this.flowGraph = flowGraph;
    }

    public TraceResponse getTraceResponse() {
        return traceResponse;
    }

    public void setTraceResponse(TraceResponse traceResponse) {
        this.traceResponse = traceResponse;
    }

    public BugPredictionDto getBugPrediction() {
        return bugPrediction;
    }

    public void setBugPrediction(BugPredictionDto bugPrediction) {
        this.bugPrediction = bugPrediction;
    }

    public ExplanationDto getExplanation() {
        return explanation;
    }

    public void setExplanation(ExplanationDto explanation) {
        this.explanation = explanation;
    }
}
