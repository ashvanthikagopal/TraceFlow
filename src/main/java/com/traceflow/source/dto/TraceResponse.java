package com.traceflow.source.dto;

import java.util.List;
import java.util.Map;

public class TraceResponse {

    public static class StepDto {
        private Long id;
        private Integer stepNo;
        private String eventType;
        private String className;
        private String methodName;
        private Integer lineNo;
        private String message;
        private Long timestampMs;
        private Map<String, VariableItemDto> variables;

        public StepDto() {}

        public StepDto(Long id, Integer stepNo, String eventType, String className, String methodName, Integer lineNo, String message, Long timestampMs, Map<String, VariableItemDto> variables) {
            this.id = id;
            this.stepNo = stepNo;
            this.eventType = eventType;
            this.className = className;
            this.methodName = methodName;
            this.lineNo = lineNo;
            this.message = message;
            this.timestampMs = timestampMs;
            this.variables = variables;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
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

        public Map<String, VariableItemDto> getVariables() {
            return variables;
        }

        public void setVariables(Map<String, VariableItemDto> variables) {
            this.variables = variables;
        }
    }

    public static class VariableItemDto {
        private String name;
        private String value;
        private String dataType;
        private String scope;
        private boolean changed;

        public VariableItemDto() {}

        public VariableItemDto(String name, String value, String dataType, String scope, boolean changed) {
            this.name = name;
            this.value = value;
            this.dataType = dataType;
            this.scope = scope;
            this.changed = changed;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
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

        public boolean isChanged() {
            return changed;
        }

        public void setChanged(boolean changed) {
            this.changed = changed;
        }
    }

    private Long analysisId;
    private int totalSteps;
    private List<StepDto> steps;

    public TraceResponse() {}

    public TraceResponse(Long analysisId, int totalSteps, List<StepDto> steps) {
        this.analysisId = analysisId;
        this.totalSteps = totalSteps;
        this.steps = steps;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public int getTotalSteps() {
        return totalSteps;
    }

    public void setTotalSteps(int totalSteps) {
        this.totalSteps = totalSteps;
    }

    public List<StepDto> getSteps() {
        return steps;
    }

    public void setSteps(List<StepDto> steps) {
        this.steps = steps;
    }
}
