package com.traceflow.service;

import com.traceflow.model.User;
import com.traceflow.repository.UserRepository;
import com.traceflow.source.dto.AuthResponse;
import com.traceflow.source.dto.LoginRequest;
import com.traceflow.source.dto.RegisterRequest;
import com.traceflow.util.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final SecurityUtil securityUtil;

    public AuthService(UserRepository userRepository, SecurityUtil securityUtil) {
        this.userRepository = userRepository;
        this.securityUtil = securityUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email '" + request.getEmail() + "' is already registered.");
        }

        String hashedPassword = securityUtil.hashPassword(request.getPassword());
        User user = new User(request.getUsername(), request.getEmail(), request.getMobileNo(), hashedPassword);
        user.setFullName(request.getFullName());
        User savedUser = userRepository.save(user);

        String token = securityUtil.generateToken(savedUser.getId(), savedUser.getUsername());
        return new AuthResponse(token, savedUser.getId(), savedUser.getUsername(), savedUser.getEmail(), "Registration successful");
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!securityUtil.matchesPassword(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        String token = securityUtil.generateToken(user.getId(), user.getUsername());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail(), "Login successful");
    }

    @Transactional
    public AuthResponse socialLogin(com.traceflow.source.dto.SocialLoginRequest request) {
        String provider = request.getProvider() != null ? request.getProvider().toLowerCase().trim() : "google";
        
        String email = request.getEmail();
        if (email == null || email.isBlank()) {
            email = "google".equalsIgnoreCase(provider) 
                    ? "google.user@traceflow.dev" 
                    : "github.developer@traceflow.dev";
        }

        String fullName = request.getFullName();
        if (fullName == null || fullName.isBlank()) {
            fullName = "google".equalsIgnoreCase(provider) ? "Google User" : "GitHub Developer";
        }

        String targetUsername = request.getUsername();
        if (targetUsername == null || targetUsername.isBlank()) {
            targetUsername = "google".equalsIgnoreCase(provider) ? "google_user" : "github_dev";
        }

        final String finalEmail = email;
        final String baseUsername = targetUsername;
        final String finalFullName = fullName;

        User user = userRepository.findByEmail(finalEmail)
                .or(() -> userRepository.findByUsername(baseUsername))
                .orElseGet(() -> {
                    String chosenUsername = baseUsername;
                    if (userRepository.existsByUsername(chosenUsername)) {
                        chosenUsername = baseUsername + "_" + (System.currentTimeMillis() % 1000);
                    }
                    String randomHash = securityUtil.hashPassword(java.util.UUID.randomUUID().toString());
                    User newUser = new User(chosenUsername, finalEmail, "9876543210", randomHash);
                    newUser.setFullName(finalFullName);
                    return userRepository.save(newUser);
                });

        String token = securityUtil.generateToken(user.getId(), user.getUsername());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail(), "Social login with " + provider.toUpperCase() + " successful");
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
    }

    @Transactional(readOnly = true)
    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
