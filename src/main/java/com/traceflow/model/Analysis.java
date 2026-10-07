package com.traceflow.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analyses")
public class Analysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Project project;

    @Column(nullable = false, length = 50)
    private String status; // PENDING, PARSING, COMPILING, COMPILATION_FAILED, TRACING, ANALYZING, COMPLETED, FAILED

    @Column(name = "error_count")
    private Integer errorCount = 0;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Lob
    @Column(name = "static_findings_json", columnDefinition = "LONGTEXT")
    private String staticFindingsJson;

    @Lob
    @Column(name = "compilation_errors_json", columnDefinition = "LONGTEXT")
    private String compilationErrorsJson;

    @Lob
    @Column(name = "flow_graph_json", columnDefinition = "LONGTEXT")
    private String flowGraphJson;

    @Lob
    @Column(name = "explanation_json", columnDefinition = "LONGTEXT")
    private String explanationJson;

    public Analysis() {
        this.status = "PENDING";
        this.startedAt = LocalDateTime.now();
    }

    public Analysis(Project project) {
        this.project = project;
        this.status = "PENDING";
        this.startedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
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

    public String getStaticFindingsJson() {
        return staticFindingsJson;
    }

    public void setStaticFindingsJson(String staticFindingsJson) {
        this.staticFindingsJson = staticFindingsJson;
    }

    public String getCompilationErrorsJson() {
        return compilationErrorsJson;
    }

    public void setCompilationErrorsJson(String compilationErrorsJson) {
        this.compilationErrorsJson = compilationErrorsJson;
    }

    public String getFlowGraphJson() {
        return flowGraphJson;
    }

    public void setFlowGraphJson(String flowGraphJson) {
        this.flowGraphJson = flowGraphJson;
    }

    public String getExplanationJson() {
        return explanationJson;
    }

    public void setExplanationJson(String explanationJson) {
        this.explanationJson = explanationJson;
    }
}
