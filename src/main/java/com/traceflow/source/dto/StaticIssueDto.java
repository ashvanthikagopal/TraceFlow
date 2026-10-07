package com.traceflow.source.dto;

public class StaticIssueDto {
    private String ruleId;
    private String severity; // ERROR, WARNING, INFO
    private String message;
    private Integer lineNo;
    private Integer columnNo;
    private String suggestion;

    public StaticIssueDto() {}

    public StaticIssueDto(String ruleId, String severity, String message, Integer lineNo, Integer columnNo, String suggestion) {
        this.ruleId = ruleId;
        this.severity = severity;
        this.message = message;
        this.lineNo = lineNo;
        this.columnNo = columnNo;
        this.suggestion = suggestion;
    }

    public String getRuleId() {
        return ruleId;
    }

    public void setRuleId(String ruleId) {
        this.ruleId = ruleId;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getLineNo() {
        return lineNo;
    }

    public void setLineNo(Integer lineNo) {
        this.lineNo = lineNo;
    }

    public Integer getColumnNo() {
        return columnNo;
    }

    public void setColumnNo(Integer columnNo) {
        this.columnNo = columnNo;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }
}
