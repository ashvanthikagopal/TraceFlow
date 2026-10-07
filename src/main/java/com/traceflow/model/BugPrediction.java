package com.traceflow.model;

import jakarta.persistence.*;

@Entity
@Table(name = "bug_predictions")
public class BugPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false)
    private Analysis analysis;

    @Column(name = "bug_type", nullable = false, length = 50)
    private String bugType; // NORMAL, INFINITE_LOOP, OFF_BY_ONE, NULL_POINTER, RECURSION_RISK

    @Column(nullable = false)
    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "feature_vector_json", columnDefinition = "TEXT")
    private String featureVectorJson;

    public BugPrediction() {
    }

    public BugPrediction(Analysis analysis, String bugType, Double confidence, String explanation, String featureVectorJson) {
        this.analysis = analysis;
        this.bugType = bugType;
        this.confidence = confidence;
        this.explanation = explanation;
        this.featureVectorJson = featureVectorJson;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Analysis getAnalysis() {
        return analysis;
    }

    public void setAnalysis(Analysis analysis) {
        this.analysis = analysis;
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

    public String getFeatureVectorJson() {
        return featureVectorJson;
    }

    public void setFeatureVectorJson(String featureVectorJson) {
        this.featureVectorJson = featureVectorJson;
    }
}
