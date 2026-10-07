package com.traceflow.source.controller;

import com.traceflow.service.TraceService;
import com.traceflow.source.dto.TraceResponse;
import com.traceflow.source.dto.VariableTimelineResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
public class TraceController {

    private final TraceService traceService;

    public TraceController(TraceService traceService) {
        this.traceService = traceService;
    }

    @GetMapping("/{id}/trace")
    public ResponseEntity<?> getTrace(@PathVariable("id") Long id) {
        try {
            TraceResponse response = traceService.getTraceByAnalysisId(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to load trace: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/variables")
    public ResponseEntity<?> getVariables(@PathVariable("id") Long id) {
        try {
            VariableTimelineResponse response = traceService.getVariableTimeline(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to load variables: " + e.getMessage()));
        }
    }
}
