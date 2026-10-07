package com.traceflow.source.dto;

public class CompilerDiagnosticDto {
    private String kind; // ERROR, WARNING, NOTE
    private Long lineNo;
    private Long columnNo;
    private String message;
    private String sourceSnippet;

    public CompilerDiagnosticDto() {}

    public CompilerDiagnosticDto(String kind, Long lineNo, Long columnNo, String message, String sourceSnippet) {
        this.kind = kind;
        this.lineNo = lineNo;
        this.columnNo = columnNo;
        this.message = message;
        this.sourceSnippet = sourceSnippet;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public Long getLineNo() {
        return lineNo;
    }

    public void setLineNo(Long lineNo) {
        this.lineNo = lineNo;
    }

    public Long getColumnNo() {
        return columnNo;
    }

    public void setColumnNo(Long columnNo) {
        this.columnNo = columnNo;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSourceSnippet() {
        return sourceSnippet;
    }

    public void setSourceSnippet(String sourceSnippet) {
        this.sourceSnippet = sourceSnippet;
    }
}
