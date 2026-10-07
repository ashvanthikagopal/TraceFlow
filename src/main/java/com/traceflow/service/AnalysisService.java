package com.traceflow.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.javaparser.ast.CompilationUnit;
import com.traceflow.model.Analysis;
import com.traceflow.model.Project;
import com.traceflow.parser.AstAnalyzer;
import com.traceflow.parser.ControlFlowAnalyzer;
import com.traceflow.parser.JavaSourceParser;
import com.traceflow.parser.StaticIssueDetector;
import com.traceflow.repository.AnalysisRepository;
import com.traceflow.source.dto.*;
import com.traceflow.util.ValidationUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);

    private final AnalysisRepository analysisRepository;
    private final ProjectService projectService;
    private final JavaSourceParser javaSourceParser;
    private final AstAnalyzer astAnalyzer;
    private final ControlFlowAnalyzer controlFlowAnalyzer;
    private final StaticIssueDetector staticIssueDetector;
    private final CompilationService compilationService;
    private final DebugService debugService;
    private final TraceService traceService;
    private final FeatureExtractionService featureExtractionService;
    private final MlService mlService;
    private final ExplanationService explanationService;
    private final ObjectMapper objectMapper;

    public AnalysisService(
            AnalysisRepository analysisRepository,
            ProjectService projectService,
            JavaSourceParser javaSourceParser,
            AstAnalyzer astAnalyzer,
            ControlFlowAnalyzer controlFlowAnalyzer,
            StaticIssueDetector staticIssueDetector,
            CompilationService compilationService,
            DebugService debugService,
            TraceService traceService,
            FeatureExtractionService featureExtractionService,
            MlService mlService,
            ExplanationService explanationService,
            ObjectMapper objectMapper) {
        this.analysisRepository = analysisRepository;
        this.projectService = projectService;
        this.javaSourceParser = javaSourceParser;
        this.astAnalyzer = astAnalyzer;
        this.controlFlowAnalyzer = controlFlowAnalyzer;
        this.staticIssueDetector = staticIssueDetector;
        this.compilationService = compilationService;
        this.debugService = debugService;
        this.traceService = traceService;
        this.featureExtractionService = featureExtractionService;
        this.mlService = mlService;
        this.explanationService = explanationService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AnalysisResponse startAnalysis(Long projectId) {
        Project project = projectService.getProjectById(projectId);

        Analysis analysis = new Analysis(project);
        analysis.setStatus("PARSING");
        analysis = analysisRepository.save(analysis);

        String sourceCode = project.getSourceCode();
        Path sourcePath = Paths.get(project.getFilePath());

        List<StaticIssueDto> staticIssues = new ArrayList<>();
        FlowGraphDto flowGraph = new FlowGraphDto();
        Optional<CompilationUnit> cuOpt = javaSourceParser.parseToCompilationUnit(sourceCode);
        CompilationUnit cu = cuOpt.orElse(null);
        staticIssues = staticIssueDetector.detectIssues(cu, sourceCode);
        flowGraph = controlFlowAnalyzer.buildFlowGraph(cu, sourceCode);

        // Compilation step
        analysis.setStatus("COMPILING");
        CompilationService.CompilationResult compResult;
        try {
            compResult = compilationService.compileJavaFile(sourcePath);
        } catch (Exception e) {
            log.error("Compilation process error", e);
            compResult = new CompilationService.CompilationResult(false, Collections.singletonList(
                    new CompilerDiagnosticDto("ERROR", 1L, 1L, "Compilation execution failed: " + e.getMessage(), "")
            ), null);
        }

        if (!compResult.isSuccess()) {
            analysis.setStatus("COMPILATION_FAILED");
            analysis.setErrorCount(compResult.getDiagnostics().size());
            analysis.setCompletedAt(LocalDateTime.now());

            // Extract features from compilation & static findings
            FeatureVectorDto features = featureExtractionService.extractFeatures(
                    sourceCode, staticIssues, compResult.getDiagnostics(), null, null
            );

            // Weka ML Classification for offline static & compilation bug identification
            AnalysisResponse.BugPredictionDto bugPrediction = mlService.predictAndSave(analysis, features);

            // Generate detailed explanation and fixed code
            AnalysisResponse.ExplanationDto explanation = explanationService.generateExplanation(
                    sourceCode, staticIssues, compResult.getDiagnostics(), null, null, bugPrediction
            );

            saveAnalysisMetadata(analysis, staticIssues, compResult.getDiagnostics(), flowGraph, explanation);
            analysisRepository.save(analysis);

            return assembleResponse(analysis, project, staticIssues, compResult.getDiagnostics(), flowGraph, null, bugPrediction, explanation);
        }

        // Dynamic JDI runtime tracing step
        analysis.setStatus("TRACING");
        String mainClassName = ValidationUtil.extractMainClassName(sourceCode, project.getName());
        DebugService.DebugExecutionResult execResult = debugService.traceExecution(compResult.getOutputDir(), mainClassName);

        // Process and persist trace
        TraceResponse traceResponse = traceService.saveAndProcessTrace(analysis, execResult.getSteps());

        // Extract ML features from both static code AST and dynamic JDI trace
        analysis.setStatus("ANALYZING");
        FeatureVectorDto features = featureExtractionService.extractFeatures(
                sourceCode, staticIssues, compResult.getDiagnostics(), execResult, traceResponse
        );

        // ML Bug Classification using Weka J48 Decision Tree
        AnalysisResponse.BugPredictionDto bugPrediction = mlService.predictAndSave(analysis, features);

        // Generate plain-language beginner and technical explanation
        AnalysisResponse.ExplanationDto explanation = explanationService.generateExplanation(
                sourceCode, staticIssues, compResult.getDiagnostics(), execResult, traceResponse, bugPrediction
        );

        // Finalize analysis
        int totalErrors = (execResult.getExceptionMessage() != null ? 1 : 0) + (execResult.isHitMaxSteps() ? 1 : 0);
        analysis.setStatus("COMPLETED");
        analysis.setErrorCount(totalErrors);
        analysis.setCompletedAt(LocalDateTime.now());

        saveAnalysisMetadata(analysis, staticIssues, compResult.getDiagnostics(), flowGraph, explanation);
        analysisRepository.save(analysis);

        return assembleResponse(analysis, project, staticIssues, compResult.getDiagnostics(), flowGraph, traceResponse, bugPrediction, explanation);
    }

    @Transactional
    public AnalysisResponse analyzeCodeDirectly(String sourceCode, String fileName, Long userId) {
        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = "Main.java";
        }
        fileName = ValidationUtil.sanitizeFilename(fileName);

        String mainClassName = ValidationUtil.extractMainClassName(sourceCode, fileName);
        String finalCode = ValidationUtil.wrapSnippetIfNeeded(sourceCode, mainClassName);

        try {
            UploadResponse uploadResp = projectService.createProjectFromSource(
                    userId != null ? userId : 1L,
                    fileName,
                    finalCode
            );
            return startAnalysis(uploadResp.getProjectId());
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to save source file for analysis: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysisById(Long analysisId) {
        Analysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis not found with id: " + analysisId));

        Project project = analysis.getProject();
        List<StaticIssueDto> staticIssues = deserializeJson(analysis.getStaticFindingsJson(), new TypeReference<List<StaticIssueDto>>() {});
        List<CompilerDiagnosticDto> compilerDiagnostics = deserializeJson(analysis.getCompilationErrorsJson(), new TypeReference<List<CompilerDiagnosticDto>>() {});
        FlowGraphDto flowGraph = deserializeJson(analysis.getFlowGraphJson(), new TypeReference<FlowGraphDto>() {});
        AnalysisResponse.ExplanationDto explanation = deserializeJson(analysis.getExplanationJson(), new TypeReference<AnalysisResponse.ExplanationDto>() {});

        TraceResponse traceResponse = traceService.getTraceByAnalysisId(analysisId);
        AnalysisResponse.BugPredictionDto bugPrediction = mlService.getPredictionByAnalysisId(analysisId);

        return assembleResponse(analysis, project, staticIssues, compilerDiagnostics, flowGraph, traceResponse, bugPrediction, explanation);
    }

    @Transactional(readOnly = true)
    public Optional<AnalysisResponse> getLatestAnalysisForProject(Long projectId) {
        return analysisRepository.findFirstByProjectIdOrderByStartedAtDesc(projectId)
                .map(a -> getAnalysisById(a.getId()));
    }

    @Transactional(readOnly = true)
    public List<AnalysisResponse> getUserAnalyses(Long userId) {
        if (userId == null || userId == 0) {
            return analysisRepository.findAll().stream()
                    .sorted((a, b) -> (b.getId() != null && a.getId() != null) ? b.getId().compareTo(a.getId()) : 0)
                    .map(a -> getAnalysisById(a.getId()))
                    .toList();
        }
        List<AnalysisResponse> userAnalyses = analysisRepository.findByProjectUserIdOrderByStartedAtDesc(userId).stream()
                .map(a -> getAnalysisById(a.getId()))
                .toList();
        if (userAnalyses.isEmpty()) {
            return analysisRepository.findAll().stream()
                    .sorted((a, b) -> (b.getId() != null && a.getId() != null) ? b.getId().compareTo(a.getId()) : 0)
                    .map(a -> getAnalysisById(a.getId()))
                    .toList();
        }
        return userAnalyses;
    }

    private void saveAnalysisMetadata(Analysis analysis, List<StaticIssueDto> staticIssues,
                                      List<CompilerDiagnosticDto> diagnostics, FlowGraphDto flowGraph,
                                      AnalysisResponse.ExplanationDto explanation) {
        try {
            if (staticIssues != null) analysis.setStaticFindingsJson(objectMapper.writeValueAsString(staticIssues));
            if (diagnostics != null) analysis.setCompilationErrorsJson(objectMapper.writeValueAsString(diagnostics));
            if (flowGraph != null) analysis.setFlowGraphJson(objectMapper.writeValueAsString(flowGraph));
            if (explanation != null) analysis.setExplanationJson(objectMapper.writeValueAsString(explanation));
        } catch (Exception e) {
            log.error("Failed to serialize analysis metadata JSON", e);
        }
    }

    private <T> T deserializeJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) return null;
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            return null;
        }
    }

    private AnalysisResponse assembleResponse(
            Analysis analysis, Project project,
            List<StaticIssueDto> staticIssues,
            List<CompilerDiagnosticDto> compilerDiagnostics,
            FlowGraphDto flowGraph,
            TraceResponse traceResponse,
            AnalysisResponse.BugPredictionDto bugPrediction,
            AnalysisResponse.ExplanationDto explanation) {

        AnalysisResponse resp = new AnalysisResponse();
        resp.setId(analysis.getId());
        resp.setProjectId(project.getId());
        resp.setProjectName(project.getName());
        resp.setSourceCode(project.getSourceCode());
        resp.setStatus(analysis.getStatus());
        resp.setErrorCount(analysis.getErrorCount());
        resp.setStartedAt(analysis.getStartedAt());
        resp.setCompletedAt(analysis.getCompletedAt());
        resp.setStaticIssues(staticIssues != null ? staticIssues : new ArrayList<>());
        resp.setCompilerDiagnostics(compilerDiagnostics != null ? compilerDiagnostics : new ArrayList<>());
        resp.setFlowGraph(flowGraph);
        resp.setTraceResponse(traceResponse);
        resp.setBugPrediction(bugPrediction);
        resp.setExplanation(explanation);
        return resp;
    }
}
