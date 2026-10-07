package com.traceflow.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.*;

public class ProcessUtil {

    public static class ProcessResult {
        private final int exitCode;
        private final String stdout;
        private final String stderr;
        private final boolean timedOut;

        public ProcessResult(int exitCode, String stdout, String stderr, boolean timedOut) {
            this.exitCode = exitCode;
            this.stdout = stdout;
            this.stderr = stderr;
            this.timedOut = timedOut;
        }

        public int getExitCode() {
            return exitCode;
        }

        public String getStdout() {
            return stdout;
        }

        public String getStderr() {
            return stderr;
        }

        public boolean isTimedOut() {
            return timedOut;
        }

        public boolean isSuccess() {
            return exitCode == 0 && !timedOut;
        }
    }

    public static ProcessResult runCommand(List<String> command, File workingDir, long timeoutMs) {
        ProcessBuilder builder = new ProcessBuilder(command);
        if (workingDir != null) {
            builder.directory(workingDir);
        }

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Process process = builder.start();

            Future<String> stdoutFuture = executor.submit(() -> readStream(process.getInputStream()));
            Future<String> stderrFuture = executor.submit(() -> readStream(process.getErrorStream()));

            boolean finished = process.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                return new ProcessResult(-1, "", "Process timed out after " + timeoutMs + "ms", true);
            }

            int exitCode = process.exitValue();
            String stdout = stdoutFuture.get(1, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(1, TimeUnit.SECONDS);

            return new ProcessResult(exitCode, stdout, stderr, false);
        } catch (Exception e) {
            return new ProcessResult(-1, "", "Error executing command: " + e.getMessage(), false);
        } finally {
            executor.shutdownNow();
        }
    }

    private static String readStream(java.io.InputStream stream) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append(System.lineSeparator());
            }
        } catch (Exception ignored) {
        }
        return sb.toString().trim();
    }
}
