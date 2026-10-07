package com.traceflow.intellitrace.parser;

import com.traceflow.intellitrace.model.ExecutionStep;
import com.traceflow.intellitrace.model.Variable;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CodeParser {

    private static final Pattern VAR_DECL_PATTERN = Pattern.compile(
            "^\\s*(?:(?:public|private|protected|static|final)\\s+)*([A-Za-z0-9_<>\\[\\]]+)\\s+([A-Za-z0-9_]+)\\s*(?:=\\s*(.+?))?\\s*;?\\s*$"
    );

    private static final Pattern CONSTRUCTOR_PATTERN = Pattern.compile(
            "^\\s*(?:public|private|protected)?\\s*([A-Z][A-Za-z0-9_]*)\\s*\\((.*)\\)\\s*\\{?\\s*$"
    );

    private static final Pattern METHOD_PATTERN = Pattern.compile(
            "^\\s*(?:(?:public|private|protected|static|final|synchronized|abstract)\\s+)+[A-Za-z0-9_<>\\[\\]]+\\s+([A-Za-z0-9_]+)\\s*\\(.*\\)\\s*\\{?\\s*$"
    );

    private static final Pattern PRINT_PATTERN = Pattern.compile(
            "System\\.out\\.(println|print|printf)\\s*\\((.*)\\)"
    );

    private static final Pattern IF_PATTERN = Pattern.compile(
            "^\\s*(?:else\\s+if|if)\\s*\\((.*)\\)"
    );

    private static final Pattern ELSE_PATTERN = Pattern.compile(
            "^\\s*else\\s*\\{?\\s*$"
    );

    private static final Pattern FOR_PATTERN = Pattern.compile(
            "^\\s*for\\s*\\((.*)\\)"
    );

    private static final Pattern WHILE_PATTERN = Pattern.compile(
            "^\\s*while\\s*\\((.*)\\)"
    );

    private static final Pattern RETURN_PATTERN = Pattern.compile(
            "^\\s*return(\\s+.*)?\\s*;?\\s*$"
    );

    private static final Pattern METHOD_CALL_PATTERN = Pattern.compile(
            "^\\s*([A-Za-z0-9_]+)\\.([A-Za-z0-9_]+)\\s*\\((.*)\\)\\s*;?\\s*$"
    );

    private static final Set<String> NON_TYPE_KEYWORDS = new HashSet<>(Arrays.asList(
            "class", "interface", "enum", "package", "import", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "throw", "throws", "try", "catch", "finally", "new"
    ));

    public ArrayList<Variable> parseVariables(ArrayList<String> lines) {
        ArrayList<Variable> variables = new ArrayList<>();
        if (lines == null || lines.isEmpty()) {
            return variables;
        }

        Map<String, String> symbolTable = new LinkedHashMap<>();
        Map<String, String> typeTable = new LinkedHashMap<>();

        for (int i = 0; i < lines.size(); i++) {
            String rawLine = lines.get(i);
            String line = stripComments(rawLine).trim();
            if (line.isEmpty() || line.startsWith("import ") || line.startsWith("package ") || line.startsWith("class ") || line.startsWith("public class ")) {
                continue;
            }

            Matcher varMatcher = VAR_DECL_PATTERN.matcher(line);
            if (varMatcher.find()) {
                String type = varMatcher.group(1);
                String name = varMatcher.group(2);
                String rawExpression = varMatcher.group(3);

                if (NON_TYPE_KEYWORDS.contains(type) || NON_TYPE_KEYWORDS.contains(name)) {
                    continue;
                }

                String evaluatedValue = "null";
                if (rawExpression != null && !rawExpression.trim().isEmpty()) {
                    String expr = rawExpression.trim();
                    if (expr.endsWith(";")) {
                        expr = expr.substring(0, expr.length() - 1).trim();
                    }
                    evaluatedValue = evaluateExpression(expr, type, symbolTable, typeTable);
                } else {
                    // Default values
                    switch (type) {
                        case "int":
                        case "long":
                        case "short":
                        case "byte":
                            evaluatedValue = "0";
                            break;
                        case "double":
                        case "float":
                            evaluatedValue = "0.0";
                            break;
                        case "boolean":
                            evaluatedValue = "false";
                            break;
                        case "char":
                            evaluatedValue = "'\\u0000'";
                            break;
                        case "String":
                            evaluatedValue = "\"\"";
                            break;
                        default:
                            if (type.contains("List") || type.contains("ArrayList")) {
                                evaluatedValue = "[]";
                            } else {
                                evaluatedValue = "null";
                            }
                            break;
                    }
                }

                symbolTable.put(name, evaluatedValue);
                typeTable.put(name, type);
                variables.add(new Variable(name, type, evaluatedValue, i + 1));
            } else if (line.contains("=") && !line.startsWith("if") && !line.startsWith("for") && !line.startsWith("while") && !line.startsWith("==")) {
                parseReassignment(line, symbolTable, typeTable);
            }
        }

        return variables;
    }

    public ArrayList<ExecutionStep> generateTimeline(ArrayList<String> lines) {
        ArrayList<ExecutionStep> steps = new ArrayList<>();
        if (lines == null || lines.isEmpty()) {
            return steps;
        }

        Map<String, String> symbolTable = new LinkedHashMap<>();
        Map<String, String> typeTable = new LinkedHashMap<>();
        int stepCounter = 1;

        for (int i = 0; i < lines.size(); i++) {
            String rawLine = lines.get(i);
            String line = stripComments(rawLine).trim();
            if (line.isEmpty() || line.startsWith("import ") || line.startsWith("package ")) {
                continue;
            }

            if (line.startsWith("class ") || line.startsWith("public class ")) {
                steps.add(new ExecutionStep(stepCounter++, i + 1, rawLine.trim(), "Defined class hierarchy: " + line.replaceAll("\\{", "").trim(), "Class Declaration"));
                continue;
            }

            int lineNo = i + 1;
            String category = "Statement";
            String description = "Executed statement";

            Matcher varMatcher = VAR_DECL_PATTERN.matcher(line);
            Matcher ctorMatcher = CONSTRUCTOR_PATTERN.matcher(line);
            Matcher methodMatcher = METHOD_PATTERN.matcher(line);
            Matcher printMatcher = PRINT_PATTERN.matcher(line);
            Matcher ifMatcher = IF_PATTERN.matcher(line);
            Matcher elseMatcher = ELSE_PATTERN.matcher(line);
            Matcher forMatcher = FOR_PATTERN.matcher(line);
            Matcher whileMatcher = WHILE_PATTERN.matcher(line);
            Matcher returnMatcher = RETURN_PATTERN.matcher(line);
            Matcher callMatcher = METHOD_CALL_PATTERN.matcher(line);

            if (ctorMatcher.find() && !line.startsWith("if") && !line.startsWith("for") && !line.startsWith("while") && !line.startsWith("return") && !line.contains("=") && !line.contains(".")) {
                category = "Constructor Declaration";
                String ctorName = ctorMatcher.group(1);
                String params = ctorMatcher.group(2);
                description = String.format("Constructor initialized for '%s(%s)'", ctorName, params);
            } else if (methodMatcher.find()) {
                category = "Method Declaration";
                String methodName = methodMatcher.group(1);
                description = String.format("Method declaration: '%s()'", methodName);
            } else if (printMatcher.find()) {
                category = "Output Statement";
                String content = printMatcher.group(2);
                String evaluatedOutput = evaluatePrintArgument(content, symbolTable);
                description = String.format("Console Output: %s", evaluatedOutput);
            } else if (ifMatcher.find()) {
                category = "If Condition";
                String condition = ifMatcher.group(1);
                String evalCond = evaluateBooleanCondition(condition, symbolTable);
                description = String.format("Branch condition: 'if (%s)' -> evaluated to %s", condition, evalCond);
            } else if (elseMatcher.find()) {
                category = "If Condition";
                description = "Else alternate execution branch";
            } else if (forMatcher.find()) {
                category = "For Loop";
                String forHeader = forMatcher.group(1);
                description = String.format("For loop iteration header: (%s)", forHeader);
            } else if (whileMatcher.find()) {
                category = "While Loop";
                String whileHeader = whileMatcher.group(1);
                description = String.format("While loop condition: (%s)", whileHeader);
            } else if (returnMatcher.find()) {
                category = "Return Statement";
                String expr = returnMatcher.group(1);
                description = expr != null && !expr.trim().isEmpty()
                        ? "Return computed value: " + expr.trim()
                        : "Return control from method";
            } else if (callMatcher.find()) {
                category = "Method Invocation";
                String targetObj = callMatcher.group(1);
                String method = callMatcher.group(2);
                String args = callMatcher.group(3);
                description = String.format("Invoked '%s.%s(%s)'", targetObj, method, args);
            } else if (varMatcher.find() && !NON_TYPE_KEYWORDS.contains(varMatcher.group(1))) {
                category = "Variable Declaration";
                String type = varMatcher.group(1);
                String name = varMatcher.group(2);
                String rawExpr = varMatcher.group(3);
                String val = "default";
                if (rawExpr != null && !rawExpr.trim().isEmpty()) {
                    String expr = rawExpr.trim();
                    if (expr.endsWith(";")) expr = expr.substring(0, expr.length() - 1).trim();
                    val = evaluateExpression(expr, type, symbolTable, typeTable);
                    symbolTable.put(name, val);
                    typeTable.put(name, type);
                    description = String.format("Declared '%s %s' initialized to %s", type, name, val);
                } else {
                    description = String.format("Declared '%s %s'", type, name);
                }
            } else if (line.contains("=") && !line.startsWith("==")) {
                category = "Assignment";
                String[] parts = line.split("=", 2);
                if (parts.length == 2) {
                    String varName = parts[0].trim();
                    String rhs = parts[1].replace(";", "").trim();
                    String varType = typeTable.getOrDefault(varName, "int");
                    String evaluatedVal = evaluateExpression(rhs, varType, symbolTable, typeTable);
                    symbolTable.put(varName, evaluatedVal);
                    description = String.format("Assigned '%s' = %s", varName, evaluatedVal);
                }
            } else {
                if (line.equals("{") || line.equals("}")) {
                    continue;
                }
                description = "Executed statement: " + line;
            }

            steps.add(new ExecutionStep(stepCounter++, lineNo, rawLine.trim(), description, category));
        }

        return steps;
    }

    private void parseReassignment(String line, Map<String, String> symbolTable, Map<String, String> typeTable) {
        try {
            String[] parts = line.split("=", 2);
            if (parts.length == 2) {
                String varName = parts[0].trim();
                String rhs = parts[1].replace(";", "").trim();
                if (symbolTable.containsKey(varName)) {
                    String type = typeTable.getOrDefault(varName, "int");
                    String eval = evaluateExpression(rhs, type, symbolTable, typeTable);
                    symbolTable.put(varName, eval);
                }
            }
        } catch (Exception ignored) {
        }
    }

    public String evaluateExpression(String expression, String targetType, Map<String, String> symbolTable, Map<String, String> typeTable) {
        if (expression == null || expression.trim().isEmpty()) {
            return "null";
        }
        String expr = expression.trim();

        // 1. Scanner operations or constructors
        if (expr.startsWith("new ")) {
            if (expr.contains("ArrayList")) return "[]";
            if (expr.contains("Scanner")) return "Scanner@System.in";
            return expr.replace("new ", "") + "@Ref";
        }
        if (expr.contains(".nextInt()")) return "85 (Simulated Int)";
        if (expr.contains(".nextLine()") || expr.contains(".next()")) return "\"Alice\" (Simulated Input)";

        // 2. String literal or string concatenation
        if ("String".equals(targetType) || expr.startsWith("\"") || (expr.contains("+") && containsStringLiteralOrVariable(expr, symbolTable, typeTable))) {
            return evaluateStringConcatenation(expr, symbolTable);
        }

        // 3. Boolean literals and expressions
        if ("boolean".equals(targetType) || expr.equals("true") || expr.equals("false") || expr.contains("&&") || expr.contains("||") || expr.contains(">") || expr.contains("<") || expr.contains("==")) {
            return evaluateBooleanCondition(expr, symbolTable);
        }

        // 4. Char literal
        if ("char".equals(targetType) && expr.startsWith("'") && expr.endsWith("'")) {
            return expr;
        }

        // 5. Numeric arithmetic expression
        try {
            String substituted = substituteVariables(expr, symbolTable);
            double result = evaluateMathExpression(substituted);
            if ("int".equals(targetType) || "long".equals(targetType) || "short".equals(targetType) || "byte".equals(targetType)) {
                return String.valueOf((long) Math.round(result));
            } else {
                if (result == (long) result) {
                    return String.format("%.1f", result);
                } else {
                    return String.valueOf(result);
                }
            }
        } catch (Exception e) {
            return expr;
        }
    }

    private boolean containsStringLiteralOrVariable(String expr, Map<String, String> symbolTable, Map<String, String> typeTable) {
        if (expr.contains("\"")) return true;
        for (Map.Entry<String, String> entry : typeTable.entrySet()) {
            if ("String".equals(entry.getValue()) && expr.contains(entry.getKey())) {
                return true;
            }
        }
        return false;
    }

    private String evaluateStringConcatenation(String expr, Map<String, String> symbolTable) {
        List<String> tokens = splitStringConcat(expr);
        StringBuilder sb = new StringBuilder();
        for (String token : tokens) {
            String t = token.trim();
            if (t.startsWith("\"") && t.endsWith("\"") && t.length() >= 2) {
                sb.append(t.substring(1, t.length() - 1));
            } else if (symbolTable.containsKey(t)) {
                String val = symbolTable.get(t);
                if (val != null && val.startsWith("\"") && val.endsWith("\"") && val.length() >= 2) {
                    sb.append(val.substring(1, val.length() - 1));
                } else {
                    sb.append(val);
                }
            } else {
                try {
                    String sub = substituteVariables(t, symbolTable);
                    double mathVal = evaluateMathExpression(sub);
                    if (mathVal == (long) mathVal) {
                        sb.append((long) mathVal);
                    } else {
                        sb.append(mathVal);
                    }
                } catch (Exception e) {
                    sb.append(t);
                }
            }
        }
        return "\"" + sb.toString() + "\"";
    }

    private List<String> splitStringConcat(String expr) {
        List<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < expr.length(); i++) {
            char c = expr.charAt(i);
            if (c == '\"' && (i == 0 || expr.charAt(i - 1) != '\\')) {
                inQuotes = !inQuotes;
                current.append(c);
            } else if (c == '+' && !inQuotes) {
                parts.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        if (current.length() > 0) {
            parts.add(current.toString().trim());
        }
        return parts;
    }

    public String evaluatePrintArgument(String rawContent, Map<String, String> symbolTable) {
        if (rawContent == null || rawContent.trim().isEmpty()) {
            return "";
        }
        String content = rawContent.trim();
        return evaluateStringConcatenation(content, symbolTable).replaceAll("^\"|\"$", "");
    }

    public String evaluateBooleanCondition(String condition, Map<String, String> symbolTable) {
        if (condition == null || condition.trim().isEmpty()) {
            return "true";
        }
        String cond = condition.trim();
        if (cond.equals("true") || cond.equals("false")) {
            return cond;
        }

        try {
            String[] operators = {">=", "<=", "==", "!=", ">", "<"};
            for (String op : operators) {
                if (cond.contains(op)) {
                    String[] parts = cond.split(Pattern.quote(op), 2);
                    if (parts.length == 2) {
                        String left = substituteVariables(parts[0].trim(), symbolTable);
                        String right = substituteVariables(parts[1].trim(), symbolTable);

                        double leftVal = evaluateMathExpression(left);
                        double rightVal = evaluateMathExpression(right);

                        boolean res = false;
                        switch (op) {
                            case ">":
                                res = leftVal > rightVal;
                                break;
                            case "<":
                                res = leftVal < rightVal;
                                break;
                            case ">=":
                                res = leftVal >= rightVal;
                                break;
                            case "<=":
                                res = leftVal <= rightVal;
                                break;
                            case "==":
                                res = leftVal == rightVal;
                                break;
                            case "!=":
                                res = leftVal != rightVal;
                                break;
                        }
                        return String.valueOf(res);
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return cond;
    }

    private String substituteVariables(String expr, Map<String, String> symbolTable) {
        String result = expr;
        for (Map.Entry<String, String> entry : symbolTable.entrySet()) {
            String name = entry.getKey();
            String val = entry.getValue();
            if (val != null && !val.startsWith("\"")) {
                result = result.replaceAll("\\b" + Pattern.quote(name) + "\\b", val);
            }
        }
        return result;
    }

    private double evaluateMathExpression(String str) {
        return new Object() {
            int pos = -1, ch;

            void nextChar() {
                ch = (++pos < str.length()) ? str.charAt(pos) : -1;
            }

            boolean eat(int charToEat) {
                while (ch == ' ') nextChar();
                if (ch == charToEat) {
                    nextChar();
                    return true;
                }
                return false;
            }

            double parse() {
                nextChar();
                double x = parseExpression();
                if (pos < str.length()) throw new RuntimeException("Unexpected: " + (char) ch);
                return x;
            }

            double parseExpression() {
                double x = parseTerm();
                for (; ; ) {
                    if (eat('+')) x += parseTerm();
                    else if (eat('-')) x -= parseTerm();
                    else return x;
                }
            }

            double parseTerm() {
                double x = parseFactor();
                for (; ; ) {
                    if (eat('*')) x *= parseFactor();
                    else if (eat('/')) x /= parseFactor();
                    else if (eat('%')) x %= parseFactor();
                    else return x;
                }
            }

            double parseFactor() {
                if (eat('+')) return parseFactor();
                if (eat('-')) return -parseFactor();

                double x;
                int startPos = this.pos;
                if (eat('(')) {
                    x = parseExpression();
                    eat(')');
                } else if ((ch >= '0' && ch <= '9') || ch == '.') {
                    while ((ch >= '0' && ch <= '9') || ch == '.') nextChar();
                    x = Double.parseDouble(str.substring(startPos, this.pos));
                } else {
                    throw new RuntimeException("Unexpected: " + (char) ch);
                }

                return x;
            }
        }.parse();
    }

    private String stripComments(String line) {
        if (line == null) return "";
        int commentIdx = line.indexOf("//");
        if (commentIdx != -1) {
            return line.substring(0, commentIdx);
        }
        return line;
    }
}
