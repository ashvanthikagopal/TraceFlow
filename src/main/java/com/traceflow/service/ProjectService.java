package com.traceflow.service;

import com.traceflow.model.Project;
import com.traceflow.model.User;
import com.traceflow.repository.ProjectRepository;
import com.traceflow.source.dto.UploadResponse;
import com.traceflow.util.FileUtil;
import com.traceflow.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final AuthService authService;
    private final Path uploadRoot;

    public ProjectService(
            ProjectRepository projectRepository,
            AuthService authService,
            @Value("${traceflow.storage.upload-dir:./workspace/uploads}") String uploadDir) {
        this.projectRepository = projectRepository;
        this.authService = authService;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Transactional
    public UploadResponse uploadJavaFile(Long userId, MultipartFile file) throws IOException {
        User user = authService.getUserById(userId);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.endsWith(".java")) {
            throw new IllegalArgumentException("Only .java source files are accepted.");
        }

        String sanitizedFilename = ValidationUtil.sanitizeFilename(originalFilename);
        String sourceCode = new String(file.getBytes(), StandardCharsets.UTF_8);

        return saveProject(user, sanitizedFilename, sourceCode);
    }

    @Transactional
    public UploadResponse createProjectFromSource(Long userId, String filename, String sourceCode) throws IOException {
        User user = authService.getUserById(userId);
        String sanitizedFilename = ValidationUtil.sanitizeFilename(filename);
        return saveProject(user, sanitizedFilename, sourceCode);
    }

    private UploadResponse saveProject(User user, String filename, String sourceCode) throws IOException {
        Path userDir = uploadRoot.resolve("user_" + user.getId()).resolve(System.currentTimeMillis() + "_" + filename.replace(".java", ""));
        Path filePath = FileUtil.writeSourceFile(userDir, filename, sourceCode);

        Project project = new Project(user, filename, filePath.toString(), sourceCode);
        Project saved = projectRepository.save(project);

        return new UploadResponse(
                saved.getId(),
                saved.getName(),
                saved.getFilePath(),
                saved.getSourceCode(),
                "Java file uploaded and stored successfully."
        );
    }

    public List<Project> getUserProjects(Long userId) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Project getProjectById(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with id: " + projectId));
    }
}
