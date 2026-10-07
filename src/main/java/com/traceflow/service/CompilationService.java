package com.traceflow.service;

import com.traceflow.source.dto.CompilerDiagnosticDto;
import com.traceflow.util.FileUtil;
import com.traceflow.util.ProcessUtil;
import org.springframework.stereotype.Service;

import javax.tools.*;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class CompilationService {

    public static class CompilationResult {
        private final boolean success;
        private final List<CompilerDiagnosticDto> diagnostics;
        private final Path outputDir;

        public CompilationResult(boolean success, List<CompilerDiagnosticDto> diagnostics, Path outputDir) {
            this.success = success;
            this.diagnostics = diagnostics;
            this.outputDir = outputDir;
        }

        public boolean isSuccess() {
            return success;
        }

        public List<CompilerDiagnosticDto> getDiagnostics() {
            return diagnostics;
        }

        public Path getOutputDir() {
            return outputDir;
        }
    }

    public CompilationResult compileJavaFile(Path sourceFilePath) throws IOException {
        Path sourceDir = sourceFilePath.getParent();
        Path outputDir = sourceDir.resolve("bin");
        FileUtil.ensureDirectoryExists(outputDir);

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler != null) {
            DiagnosticCollector<JavaFileObject> diagnosticsCollector = new DiagnosticCollector<>();
            StandardJavaFileManager fileManager = compiler.getStandardFileManager(diagnosticsCollector, Locale.ENGLISH, StandardCharsets.UTF_8);

            List<String> options = Arrays.asList("-g", "-d", outputDir.toString());
            Iterable<? extends JavaFileObject> compilationUnits = fileManager.getJavaFileObjects(sourceFilePath.toFile());

            JavaCompiler.CompilationTask task = compiler.getTask(
                    null,
                    fileManager,
                    diagnosticsCollector,
                    options,
                    null,
                    compilationUnits
            );

            boolean success = task.call();
            fileManager.close();

            List<CompilerDiagnosticDto> diagnostics = new ArrayList<>();
            List<String> sourceLines = Files.readAllLines(sourceFilePath, StandardCharsets.UTF_8);

            for (Diagnostic<? extends JavaFileObject> d : diagnosticsCollector.getDiagnostics()) {
                long lineNo = d.getLineNumber();
                String snippet = (lineNo > 0 && lineNo <= sourceLines.size()) ? sourceLines.get((int) lineNo - 1).trim() : "";
                diagnostics.add(new CompilerDiagnosticDto(
                        d.getKind().name(),
                        lineNo,
                        d.getColumnNumber(),
                        d.getMessage(Locale.ENGLISH),
                        snippet
                ));
            }

            return new CompilationResult(success, diagnostics, outputDir);
        } else {
            // Fallback to local javac command with -g
            List<String> cmd = Arrays.asList("javac", "-g", "-d", outputDir.toString(), sourceFilePath.toString());
            ProcessUtil.ProcessResult result = ProcessUtil.runCommand(cmd, sourceDir.toFile(), 10000);

            List<CompilerDiagnosticDto> diagnostics = new ArrayList<>();
            boolean success = result.isSuccess();

            if (!success) {
                String errorOutput = result.getStderr().isEmpty() ? result.getStdout() : result.getStderr();
                diagnostics.add(new CompilerDiagnosticDto(
                        "ERROR",
                        1L,
                        1L,
                        errorOutput.isEmpty() ? "Compilation failed without detailed error output." : errorOutput,
                        ""
                ));
            }

            return new CompilationResult(success, diagnostics, outputDir);
        }
    }
}
