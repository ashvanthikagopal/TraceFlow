package com.traceflow.source.controller;

import com.traceflow.model.Project;
import com.traceflow.service.ProjectService;
import com.traceflow.source.dto.UploadResponse;
import com.traceflow.util.SecurityUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class FileController {

    private final ProjectService projectService;
    private final SecurityUtil securityUtil;

    public FileController(ProjectService projectService, SecurityUtil securityUtil) {
        this.projectService = projectService;
        this.securityUtil = securityUtil;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "userId", required = false) Long paramUserId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Long userId = resolveUserId(paramUserId, authHeader);
            UploadResponse response = projectService.uploadJavaFile(userId, file);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "File upload failed: " + e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createFromCode(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            String filename = (String) payload.getOrDefault("name", "Main.java");
            String sourceCode = (String) payload.getOrDefault("sourceCode", "");
            Object uIdObj = payload.get("userId");
            Long paramUserId = uIdObj instanceof Number ? ((Number) uIdObj).longValue() : null;

            Long userId = resolveUserId(paramUserId, authHeader);
            UploadResponse response = projectService.createProjectFromSource(userId, filename, sourceCode);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Project creation failed: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserProjects(
            @RequestParam(value = "userId", required = false) Long paramUserId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Long userId = resolveUserId(paramUserId, authHeader);
            List<Project> projects = projectService.getUserProjects(userId);
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable("id") Long id) {
        try {
            Project project = projectService.getProjectById(id);
            return ResponseEntity.ok(project);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private Long resolveUserId(Long paramUserId, String authHeader) {
        if (paramUserId != null && paramUserId > 0) {
            return paramUserId;
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            Long tokenUserId = securityUtil.extractUserId(token);
            if (tokenUserId != null) return tokenUserId;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getCredentials() instanceof Long) {
            return (Long) auth.getCredentials();
        }
        return 1L; // Local offline default user ID fallback
    }
}
