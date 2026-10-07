package com.traceflow.source.dto;

public class UploadResponse {
    private Long projectId;
    private String projectName;
    private String filePath;
    private String sourceCode;
    private String message;

    public UploadResponse() {}

    public UploadResponse(Long projectId, String projectName, String filePath, String sourceCode, String message) {
        this.projectId = projectId;
        this.projectName = projectName;
        this.filePath = filePath;
        this.sourceCode = sourceCode;
        this.message = message;
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

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
