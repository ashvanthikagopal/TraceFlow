package com.traceflow.model;

import jakarta.persistence.*;

@Entity
@Table(name = "variable_states")
public class VariableState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trace_event_id", nullable = false)
    private TraceEvent traceEvent;

    @Column(name = "variable_name", nullable = false, length = 100)
    private String variableName;

    @Lob
    @Column(name = "var_value", columnDefinition = "LONGTEXT")
    private String value;

    @Column(name = "data_type", length = 100)
    private String dataType;

    @Column(name = "scope", length = 100)
    private String scope;

    public VariableState() {
    }

    public VariableState(TraceEvent traceEvent, String variableName, String value, String dataType, String scope) {
        this.traceEvent = traceEvent;
        this.variableName = variableName;
        this.value = value;
        this.dataType = dataType;
        this.scope = scope;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TraceEvent getTraceEvent() {
        return traceEvent;
    }

    public void setTraceEvent(TraceEvent traceEvent) {
        this.traceEvent = traceEvent;
    }

    public String getVariableName() {
        return variableName;
    }

    public void setVariableName(String variableName) {
        this.variableName = variableName;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }
}
