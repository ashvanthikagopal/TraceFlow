package com.traceflow.source.dto;

public class SocialLoginRequest {

    private String provider;
    private String email;
    private String username;
    private String fullName;
    private String avatarUrl;

    public SocialLoginRequest() {
    }

    public SocialLoginRequest(String provider, String email, String username, String fullName) {
        this.provider = provider;
        this.email = email;
        this.username = username;
        this.fullName = fullName;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
