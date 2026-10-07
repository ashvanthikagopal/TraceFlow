package com.traceflow.source.controller;

import com.traceflow.service.AnalysisService;
import com.traceflow.service.IntelliTraceBridgeService;
import com.traceflow.service.MlService;
import com.traceflow.source.dto.AnalysisResponse;
import com.traceflow.source.dto.IntelliTraceResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;
    private final MlService mlService;
    private final IntelliTraceBridgeService intelliTraceBridgeService;

    public AnalysisController(AnalysisService analysisService, MlService mlService, IntelliTraceBridgeService intelliTraceBridgeService) {
        this.analysisService = analysisService;
        this.mlService = mlService;
        this.intelliTraceBridgeService = intelliTraceBridgeService;
    }

    @PostMapping("/{projectId}/start")
    public ResponseEntity<?> startAnalysis(@PathVariable("projectId") Long projectId) {
        try {
            AnalysisResponse response = analysisService.startAnalysis(projectId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Analysis failed: " + e.getMessage()));
        }
    }

    @PostMapping("/debug-code")
    public ResponseEntity<?> debugCodeDirectly(@RequestBody Map<String, Object> request) {
        try {
            String sourceCode = (String) request.getOrDefault("sourceCode", "");
            String fileName = (String) request.getOrDefault("fileName", "Main.java");
            Object uIdObj = request.get("userId");
            Long userId = uIdObj instanceof Number ? ((Number) uIdObj).longValue() : 1L;

            AnalysisResponse response = analysisService.analyzeCodeDirectly(sourceCode, fileName, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Code debugging failed: " + e.getMessage()));
        }
    }

    @PostMapping("/intellitrace")
    public ResponseEntity<?> runIntelliTrace(@RequestBody Map<String, String> request) {
        try {
            String sourceCode = request.getOrDefault("sourceCode", "");
            String fileName = request.getOrDefault("fileName", "Sample.java");
            IntelliTraceResponse response = intelliTraceBridgeService.analyzeSourceCode(sourceCode, fileName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "IntelliTrace static analysis failed: " + e.getMessage()));
        }
    }

    @GetMapping("/sample-code")
    public ResponseEntity<?> getSampleCode() {
        try {
            Path samplePath = Path.of("data/Sample.java");
            String code;
            if (Files.exists(samplePath)) {
                code = Files.readString(samplePath);
            } else {
                code = "public class Sample {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        int a = 10;\n" +
                        "        int b = 20;\n" +
                        "        int sum = a + b;\n" +
                        "        System.out.println(\"Sum: \" + sum);\n" +
                        "    }\n" +
                        "}";
            }
            return ResponseEntity.ok(Map.of("fileName", "Sample.java", "sourceCode", code));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to load sample code: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/export/csv")
    public ResponseEntity<?> exportCsv(@PathVariable("id") Long id) {
        try {
            byte[] csvBytes = intelliTraceBridgeService.exportTraceToCsv(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=traceflow_execution_log_" + id + ".csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to export CSV: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAnalysis(@PathVariable("id") Long id) {
        try {
            AnalysisResponse response = analysisService.getAnalysisById(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/project/{projectId}/latest")
    public ResponseEntity<?> getLatestAnalysisForProject(@PathVariable("projectId") Long projectId) {
        return analysisService.getLatestAnalysisForProject(projectId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserAnalyses(@PathVariable("userId") Long userId) {
        try {
            return ResponseEntity.ok(analysisService.getUserAnalyses(userId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/prediction")
    public ResponseEntity<?> getPrediction(@PathVariable("id") Long id) {
        AnalysisResponse.BugPredictionDto prediction = mlService.getPredictionByAnalysisId(id);
        if (prediction == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(prediction);
    }
}
