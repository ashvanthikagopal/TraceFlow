package com.traceflow.source.dto;

import java.util.List;
import java.util.Map;

public class VariableTimelineResponse {

    public static class HistoryPoint {
        private int stepNo;
        private int lineNo;
        private String value;
        private String dataType;
        private boolean changed;

        public HistoryPoint() {}

        public HistoryPoint(int stepNo, int lineNo, String value, String dataType, boolean changed) {
            this.stepNo = stepNo;
            this.lineNo = lineNo;
            this.value = value;
            this.dataType = dataType;
            this.changed = changed;
        }

        public int getStepNo() {
            return stepNo;
        }

        public void setStepNo(int stepNo) {
            this.stepNo = stepNo;
        }

        public int getLineNo() {
            return lineNo;
        }

        public void setLineNo(int lineNo) {
            this.lineNo = lineNo;
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

        public boolean isChanged() {
            return changed;
        }

        public void setChanged(boolean changed) {
            this.changed = changed;
        }
    }

    private Long analysisId;
    private Map<String, List<HistoryPoint>> timelines;

    public VariableTimelineResponse() {}

    public VariableTimelineResponse(Long analysisId, Map<String, List<HistoryPoint>> timelines) {
        this.analysisId = analysisId;
        this.timelines = timelines;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public Map<String, List<HistoryPoint>> getTimelines() {
        return timelines;
    }

    public void setTimelines(Map<String, List<HistoryPoint>> timelines) {
        this.timelines = timelines;
    }
}
