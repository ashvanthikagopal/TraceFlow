package com.traceflow.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ValidationUtil {

    private static final Pattern PUBLIC_CLASS_PATTERN = Pattern.compile("public\\s+class\\s+([A-Za-z0-9_]+)");
    private static final Pattern CLASS_PATTERN = Pattern.compile("class\\s+([A-Za-z0-9_]+)");
    private static final Pattern MAIN_METHOD_PATTERN = Pattern.compile("public\\s+static\\s+void\\s+main\\s*\\(");

    public static boolean isValidJavaFilename(String filename) {
        if (filename == null || !filename.endsWith(".java")) {
            return false;
        }
        String baseName = filename.substring(0, filename.length() - 5);
        if (baseName.isEmpty()) return false;
        if (!Character.isJavaIdentifierStart(baseName.charAt(0))) return false;
        for (int i = 1; i < baseName.length(); i++) {
            if (!Character.isJavaIdentifierPart(baseName.charAt(i))) return false;
        }
        return true;
    }

    public static String sanitizeFilename(String filename) {
        if (filename == null) return "Main.java";
        String clean = filename.replaceAll("[^A-Za-z0-9_\\-\\.]", "");
        if (!clean.endsWith(".java")) {
            clean += ".java";
        }
        return clean;
    }

    public static String extractMainClassName(String sourceCode, String fallbackFilename) {
        if (sourceCode != null) {
            Matcher publicMatcher = PUBLIC_CLASS_PATTERN.matcher(sourceCode);
            if (publicMatcher.find()) {
                return publicMatcher.group(1);
            }
            Matcher classMatcher = CLASS_PATTERN.matcher(sourceCode);
            if (classMatcher.find()) {
                return classMatcher.group(1);
            }
        }
        if (fallbackFilename != null && fallbackFilename.endsWith(".java")) {
            return fallbackFilename.substring(0, fallbackFilename.length() - 5);
        }
        return "Main";
    }

    public static boolean containsClassDeclaration(String sourceCode) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) return false;
        return CLASS_PATTERN.matcher(sourceCode).find();
    }

    public static boolean containsMainMethod(String sourceCode) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) return false;
        return MAIN_METHOD_PATTERN.matcher(sourceCode).find();
    }

    public static String wrapSnippetIfNeeded(String sourceCode, String className) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            return "public class " + className + " {\n    public static void main(String[] args) {}\n}";
        }

        // If it's already a full class with a main method, leave it as is
        if (containsClassDeclaration(sourceCode) && containsMainMethod(sourceCode)) {
            return sourceCode;
        }

        // If it's a class but has no main method, add a main runner
        if (containsClassDeclaration(sourceCode) && !containsMainMethod(sourceCode)) {
            int lastBrace = sourceCode.lastIndexOf('}');
            if (lastBrace != -1) {
                String mainRunner = "\n    public static void main(String[] args) {\n        // Auto-generated test harness runner\n    }\n";
                return sourceCode.substring(0, lastBrace) + mainRunner + sourceCode.substring(lastBrace);
            }
            return sourceCode;
        }

        // Otherwise, it's a raw code snippet (e.g. statements / logic), wrap it inside class & main
        StringBuilder wrapped = new StringBuilder();
        wrapped.append("public class ").append(className).append(" {\n");
        wrapped.append("    public static void main(String[] args) {\n");
        String[] lines = sourceCode.split("\\r?\\n");
        for (String line : lines) {
            wrapped.append("        ").append(line).append("\n");
        }
        wrapped.append("    }\n");
        wrapped.append("}\n");
        return wrapped.toString();
    }
}

