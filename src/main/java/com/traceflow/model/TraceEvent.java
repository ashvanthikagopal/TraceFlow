package com.traceflow.model;

import jakarta.persistence.*;

@Entity
@Table(name = "trace_events")
public class TraceEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false)
    private Analysis analysis;

    @Column(name = "step_no", nullable = false)
    private Integer stepNo;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // LINE, METHOD_ENTRY, METHOD_EXIT, EXCEPTION, LOOP_ITERATION, BRANCH

    @Column(name = "class_name", length = 255)
    private String className;

    @Column(name = "method_name", length = 255)
    private String methodName;

    @Column(name = "line_no")
    private Integer lineNo;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "timestamp_ms")
    private Long timestampMs;

    public TraceEvent() {
        this.timestampMs = System.currentTimeMillis();
    }

    public TraceEvent(Analysis analysis, Integer stepNo, String eventType, String className, String methodName, Integer lineNo, String message) {
        this.analysis = analysis;
        this.stepNo = stepNo;
        this.eventType = eventType;
        this.className = className;
        this.methodName = methodName;
        this.lineNo = lineNo;
        this.message = message;
        this.timestampMs = System.currentTimeMillis();
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

    public Integer getStepNo() {
        return stepNo;
    }

    public void setStepNo(Integer stepNo) {
        this.stepNo = stepNo;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getMethodName() {
        return methodName;
    }

    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }

    public Integer getLineNo() {
        return lineNo;
    }

    public void setLineNo(Integer lineNo) {
        this.lineNo = lineNo;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getTimestampMs() {
        return timestampMs;
    }

    public void setTimestampMs(Long timestampMs) {
        this.timestampMs = timestampMs;
    }
}
