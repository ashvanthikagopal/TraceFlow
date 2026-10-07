package com.traceflow.parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.ConstructorDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JavaSourceParser {

    private final JavaParser javaParser;

    public JavaSourceParser() {
        ParserConfiguration config = new ParserConfiguration();
        config.setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_17);
        config.setAttributeComments(false);
        this.javaParser = new JavaParser(config);
    }

    public ParseResult<CompilationUnit> parse(String sourceCode) {
        return javaParser.parse(sourceCode);
    }

    public Optional<CompilationUnit> parseToCompilationUnit(String sourceCode) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            return Optional.empty();
        }

        ParseResult<CompilationUnit> result = parse(sourceCode);
        if (result.isSuccessful() && result.getResult().isPresent()) {
            return result.getResult();
        }

        // Try repairing common syntax bugs (missing semicolons, missing braces before else, etc.)
        String repairedCode = autoRepairSyntax(sourceCode);
        ParseResult<CompilationUnit> repairedResult = parse(repairedCode);
        if (repairedResult.getResult().isPresent()) {
            return repairedResult.getResult();
        }

        return result.getResult();
    }

    public String autoRepairSyntax(String sourceCode) {
        if (sourceCode == null) return "";
        String[] lines = sourceCode.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String trimmed = line.trim();

            // Check missing closing brace before else
            if (trimmed.startsWith("else") || trimmed.startsWith("else ")) {
                // Check if previous non-empty line ended with closing brace
                String prev = getPreviousNonEmptyLine(lines, i - 1);
                if (prev != null && !prev.endsWith("}") && !prev.endsWith("{")) {
                    sb.append("        }\n");
                }
            }

            // Check missing semicolon on statements
            if (!trimmed.isEmpty()
                    && !trimmed.endsWith(";")
                    && !trimmed.endsWith("{")
                    && !trimmed.endsWith("}")
                    && !trimmed.startsWith("//")
                    && !trimmed.startsWith("/*")
                    && !trimmed.startsWith("*")
                    && !trimmed.startsWith("if")
                    && !trimmed.startsWith("else")
                    && !trimmed.startsWith("for")
                    && !trimmed.startsWith("while")
                    && !trimmed.startsWith("class")
                    && !trimmed.startsWith("public class")
                    && !trimmed.startsWith("interface")
                    && !trimmed.contains("(") == false // has statement call or assignment
            ) {
                // If it looks like a method call or variable decl without semicolon
                if (trimmed.contains("(") || trimmed.contains("=") || trimmed.startsWith("return")) {
                    line = line + ";";
                }
            }

            // Fix empty return in non-void method if it's 'return;'
            if (trimmed.equals("return;") || trimmed.equals("return")) {
                line = line.replace("return;", "return 0;").replace("return", "return 0;");
            }

            sb.append(line).append("\n");
        }

        return sb.toString();
    }

    private String getPreviousNonEmptyLine(String[] lines, int fromIndex) {
        for (int i = fromIndex; i >= 0; i--) {
            String t = lines[i].trim();
            if (!t.isEmpty()) return t;
        }
        return null;
    }

    public List<String> extractClassNames(CompilationUnit cu) {
        List<String> names = new ArrayList<>();
        if (cu != null) {
            cu.findAll(ClassOrInterfaceDeclaration.class).forEach(cid -> names.add(cid.getNameAsString()));
        }
        return names;
    }

    public List<String> extractMethodSignatures(CompilationUnit cu) {
        List<String> methods = new ArrayList<>();
        if (cu != null) {
            cu.findAll(ConstructorDeclaration.class).forEach(cd -> methods.add(cd.getDeclarationAsString(false, false, false)));
            cu.findAll(MethodDeclaration.class).forEach(md -> methods.add(md.getDeclarationAsString(false, false, false)));
        }
        return methods;
    }

    public Optional<MethodDeclaration> findMainMethod(CompilationUnit cu) {
        if (cu == null) return Optional.empty();
        return cu.findAll(MethodDeclaration.class).stream()
                .filter(md -> md.getNameAsString().equals("main") && md.isStatic() && md.isPublic())
                .findFirst();
    }
}
