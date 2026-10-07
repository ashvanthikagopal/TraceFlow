package com.traceflow.util;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Comparator;

public class FileUtil {

    public static void ensureDirectoryExists(Path path) throws IOException {
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }
    }

    public static Path writeSourceFile(Path directory, String filename, String content) throws IOException {
        ensureDirectoryExists(directory);
        Path target = directory.resolve(filename);
        Files.writeString(target, content, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return target;
    }

    public static String readFileContent(Path path) throws IOException {
        return Files.readString(path, StandardCharsets.UTF_8);
    }

    public static void deleteDirectoryRecursively(Path path) {
        if (path == null || !Files.exists(path)) {
            return;
        }
        try {
            Files.walk(path)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        } catch (IOException ignored) {
        }
    }
}
