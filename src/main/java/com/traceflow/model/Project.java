package com.traceflow.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Lob
    @Column(name = "source_code", columnDefinition = "LONGTEXT")
    private String sourceCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Project() {
        this.createdAt = LocalDateTime.now();
    }

    public Project(User user, String name, String filePath, String sourceCode) {
        this.user = user;
        this.name = name;
        this.filePath = filePath;
        this.sourceCode = sourceCode;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
