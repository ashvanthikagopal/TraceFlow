package com.traceflow.source.controller;

import com.traceflow.service.AuthService;
import com.traceflow.source.dto.AuthResponse;
import com.traceflow.source.dto.LoginRequest;
import com.traceflow.source.dto.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/social-login")
    public ResponseEntity<?> socialLogin(@RequestBody com.traceflow.source.dto.SocialLoginRequest request) {
        try {
            AuthResponse response = authService.socialLogin(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Social authentication failed: " + e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            var users = authService.getAllUsers().stream().map(u -> Map.of(
                    "id", u.getId(),
                    "fullName", u.getFullName() != null ? u.getFullName() : "",
                    "username", u.getUsername(),
                    "email", u.getEmail(),
                    "mobileNo", u.getMobileNo() != null ? u.getMobileNo() : "",
                    "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
            )).toList();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to retrieve users: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "message", "TraceFlow authentication service is operational"));
    }
}
