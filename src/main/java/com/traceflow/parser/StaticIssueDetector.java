package com.traceflow.parser;

import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.ConstructorDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.*;
import com.github.javaparser.ast.stmt.*;
import com.traceflow.source.dto.StaticIssueDto;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class StaticIssueDetector {

    public List<StaticIssueDto> detectIssues(CompilationUnit cu) {
        return detectIssues(cu, null);
    }

    public List<StaticIssueDto> detectIssues(CompilationUnit cu, String sourceCode) {
        List<StaticIssueDto> issues = new ArrayList<>();

        if (cu != null) {
            checkInfiniteLoops(cu, issues);
            checkForLoopInfinite(cu, issues);
            checkOffByOneErrors(cu, issues);
            checkNullDereference(cu, issues);
            checkDivisionByZero(cu, issues);
            checkResourceLeaks(cu, issues);
            checkStringIndexOutOfBounds(cu, issues);
            checkUnreachableStatements(cu, issues);
            checkAssignmentsInConditions(cu, issues);
            checkEmptyCatchBlocks(cu, issues);
            checkUnboundedRecursion(cu, issues);
            checkConstructorSelfAssignment(cu, issues);
            checkEmptyReturnInNonVoid(cu, issues);
            checkIntegerDivision(cu, issues);
        }

        if (sourceCode != null && !sourceCode.trim().isEmpty()) {
            checkSourceCodeRegexPatterns(sourceCode, issues);
        }

        return issues;
    }

    private void checkInfiniteLoops(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(WhileStmt.class).forEach(ws -> {
            Expression cond = ws.getCondition();
            int line = ws.getBegin().map(p -> p.line).orElse(0);

            if (cond.isBooleanLiteralExpr() && cond.asBooleanLiteralExpr().getValue()) {
                boolean hasBreakOrReturn = !ws.findAll(BreakStmt.class).isEmpty() || !ws.findAll(ReturnStmt.class).isEmpty();
                if (!hasBreakOrReturn) {
                    issues.add(new StaticIssueDto(
                            "STATIC_INFINITE_LOOP",
                            "ERROR",
                            "Infinite loop detected: 'while(true)' contains no break or return statements.",
                            line,
                            1,
                            "Add a termination condition or a break statement inside the loop body."
                    ));
                }
            } else if (cond.isBinaryExpr()) {
                BinaryExpr be = cond.asBinaryExpr();
                Set<String> condVars = new HashSet<>();
                be.findAll(NameExpr.class).forEach(ne -> condVars.add(ne.getNameAsString()));

                boolean modified = false;
                for (String varName : condVars) {
                    for (AssignExpr ae : ws.findAll(AssignExpr.class)) {
                        if (ae.getTarget().isNameExpr() && ae.getTarget().asNameExpr().getNameAsString().equals(varName)) {
                            modified = true;
                            break;
                        }
                    }
                    for (UnaryExpr ue : ws.findAll(UnaryExpr.class)) {
                        if (ue.getExpression().isNameExpr() && ue.getExpression().asNameExpr().getNameAsString().equals(varName)) {
                            modified = true;
                            break;
                        }
                    }
                }
                if (!condVars.isEmpty() && !modified && ws.findAll(BreakStmt.class).isEmpty() && ws.findAll(ReturnStmt.class).isEmpty()) {
                    issues.add(new StaticIssueDto(
                            "STATIC_UNMODIFIED_LOOP_VAR",
                            "WARNING",
                            "Loop variable in condition is never updated in the loop body, potentially causing an infinite loop.",
                            line,
                            1,
                            "Ensure loop control variables are updated (e.g., incremented or decremented) on each iteration."
                    ));
                }
            }
        });
    }

    private void checkForLoopInfinite(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(ForStmt.class).forEach(fs -> {
            int line = fs.getBegin().map(p -> p.line).orElse(0);
            if (fs.getCompare().isPresent() && !fs.getUpdate().isEmpty()) {
                Expression comp = fs.getCompare().get();
                if (comp.isBinaryExpr()) {
                    BinaryExpr be = comp.asBinaryExpr();
                    BinaryExpr.Operator op = be.getOperator();
                    String leftVar = be.getLeft().toString().trim();

                    for (Expression updateExpr : fs.getUpdate()) {
                        if (updateExpr.isUnaryExpr()) {
                            UnaryExpr ue = updateExpr.asUnaryExpr();
                            String updateVar = ue.getExpression().toString().trim();
                            if (leftVar.equals(updateVar)) {
                                // e.g. i < 3 with i-- (decrementing when condition is < max)
                                if ((op == BinaryExpr.Operator.LESS || op == BinaryExpr.Operator.LESS_EQUALS)
                                        && (ue.getOperator() == UnaryExpr.Operator.POSTFIX_DECREMENT || ue.getOperator() == UnaryExpr.Operator.PREFIX_DECREMENT)) {
                                    issues.add(new StaticIssueDto(
                                            "STATIC_INFINITE_FOR_LOOP",
                                            "ERROR",
                                            "Infinite loop detected: Counter '" + updateVar + "' is decremented ('" + ue + "') while condition requires '" + be + "'.",
                                            line,
                                            1,
                                            "Change '" + ue + "' to '" + updateVar + "++' so the counter increases toward the upper bound."
                                    ));
                                }
                                // e.g. i > 0 with i++ (incrementing when condition is > min)
                                else if ((op == BinaryExpr.Operator.GREATER || op == BinaryExpr.Operator.GREATER_EQUALS)
                                        && (ue.getOperator() == UnaryExpr.Operator.POSTFIX_INCREMENT || ue.getOperator() == UnaryExpr.Operator.PREFIX_INCREMENT)) {
                                    issues.add(new StaticIssueDto(
                                            "STATIC_INFINITE_FOR_LOOP",
                                            "ERROR",
                                            "Infinite loop detected: Counter '" + updateVar + "' is incremented ('" + ue + "') while condition requires '" + be + "'.",
                                            line,
                                            1,
                                            "Change '" + ue + "' to '" + updateVar + "--' so the counter decreases toward the lower bound."
                                    ));
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    private void checkOffByOneErrors(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(ForStmt.class).forEach(fs -> {
            fs.getCompare().ifPresent(comp -> {
                int line = comp.getBegin().map(p -> p.line).orElse(0);
                if (comp.isBinaryExpr()) {
                    BinaryExpr be = comp.asBinaryExpr();
                    if (be.getOperator() == BinaryExpr.Operator.LESS_EQUALS) {
                        String rightStr = be.getRight().toString();
                        if (rightStr.endsWith(".length") || rightStr.endsWith(".size()") || rightStr.endsWith(".length()")) {
                            issues.add(new StaticIssueDto(
                                    "STATIC_OFF_BY_ONE",
                                    "WARNING",
                                    "Potential off-by-one error: using '<=' with array or collection length (" + rightStr + ").",
                                    line,
                                    1,
                                    "Arrays and collections are 0-indexed. Use '< " + rightStr + "' instead of '<=' to avoid IndexOutOfBoundsException."
                            ));
                        }
                    }
                }
            });
        });
    }

    private void checkConstructorSelfAssignment(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(ConstructorDeclaration.class).forEach(cd -> {
            Set<String> paramNames = new HashSet<>();
            for (Parameter p : cd.getParameters()) {
                paramNames.add(p.getNameAsString());
            }

            cd.findAll(AssignExpr.class).forEach(ae -> {
                if (ae.getTarget().isNameExpr() && ae.getValue().isNameExpr()) {
                    String target = ae.getTarget().asNameExpr().getNameAsString();
                    String value = ae.getValue().asNameExpr().getNameAsString();
                    if (target.equals(value) && paramNames.contains(target)) {
                        int line = ae.getBegin().map(p -> p.line).orElse(0);
                        issues.add(new StaticIssueDto(
                                "STATIC_SELF_ASSIGNMENT_SHADOWING",
                                "ERROR",
                                "Variable shadowing bug: '" + target + " = " + value + "' assigns parameter to itself without initializing instance field.",
                                line,
                                1,
                                "Change to 'this." + target + " = " + value + ";' to initialize the class field."
                        ));
                    }
                }
            });
        });

        // Also check methods
        cu.findAll(MethodDeclaration.class).forEach(md -> {
            Set<String> paramNames = new HashSet<>();
            for (Parameter p : md.getParameters()) {
                paramNames.add(p.getNameAsString());
            }

            md.findAll(AssignExpr.class).forEach(ae -> {
                if (ae.getTarget().isNameExpr() && ae.getValue().isNameExpr()) {
                    String target = ae.getTarget().asNameExpr().getNameAsString();
                    String value = ae.getValue().asNameExpr().getNameAsString();
                    if (target.equals(value) && paramNames.contains(target)) {
                        int line = ae.getBegin().map(p -> p.line).orElse(0);
                        issues.add(new StaticIssueDto(
                                "STATIC_SELF_ASSIGNMENT_SHADOWING",
                                "ERROR",
                                "Variable shadowing bug: '" + target + " = " + value + "' assigns parameter to itself without setting instance field.",
                                line,
                                1,
                                "Change to 'this." + target + " = " + value + ";' to set the instance field."
                        ));
                    }
                }
            });
        });
    }

    private void checkEmptyReturnInNonVoid(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(MethodDeclaration.class).forEach(md -> {
            if (!md.getType().isVoidType()) {
                md.findAll(ReturnStmt.class).forEach(rs -> {
                    if (rs.getExpression().isEmpty()) {
                        int line = rs.getBegin().map(p -> p.line).orElse(0);
                        issues.add(new StaticIssueDto(
                                "STATIC_EMPTY_RETURN",
                                "ERROR",
                                "Missing return value: Method '" + md.getNameAsString() + "()' declared return type '" + md.getType() + "' but contains an empty 'return;'.",
                                line,
                                1,
                                "Return a valid '" + md.getType() + "' value (e.g., 'return total;')."
                        ));
                    }
                });
            }
        });
    }

    private void checkIntegerDivision(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(MethodDeclaration.class).forEach(md -> {
            String returnType = md.getTypeAsString();
            if ("double".equals(returnType) || "float".equals(returnType)) {
                md.findAll(ReturnStmt.class).forEach(rs -> {
                    rs.getExpression().ifPresent(expr -> {
                        if (expr.isBinaryExpr()) {
                            BinaryExpr be = expr.asBinaryExpr();
                            if (be.getOperator() == BinaryExpr.Operator.DIVIDE) {
                                int line = rs.getBegin().map(p -> p.line).orElse(0);
                                issues.add(new StaticIssueDto(
                                        "STATIC_INTEGER_DIVISION",
                                        "WARNING",
                                        "Integer division truncation: Division operation in return statement may truncate decimal precision before converting to '" + returnType + "'.",
                                        line,
                                        1,
                                        "Cast one of the operands to double: '(double) " + be.getLeft() + " / " + be.getRight() + "'."
                                ));
                            }
                        }
                    });
                });
            }
        });
    }

    private void checkNullDereference(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(MethodDeclaration.class).forEach(md -> {
            Map<String, Integer> nullVars = new HashMap<>();
            md.findAll(VariableDeclarator.class).forEach(vd -> {
                if (vd.getInitializer().isPresent() && vd.getInitializer().get().isNullLiteralExpr()) {
                    nullVars.put(vd.getNameAsString(), vd.getBegin().map(p -> p.line).orElse(0));
                }
            });

            md.findAll(MethodCallExpr.class).forEach(mce -> {
                mce.getScope().ifPresent(scope -> {
                    if (scope.isNameExpr()) {
                        String varName = scope.asNameExpr().getNameAsString();
                        if (nullVars.containsKey(varName)) {
                            int line = mce.getBegin().map(p -> p.line).orElse(0);
                            issues.add(new StaticIssueDto(
                                    "STATIC_NULL_DEREFERENCE",
                                    "WARNING",
                                    "Method invocation on variable '" + varName + "' which was initialized to null.",
                                    line,
                                    1,
                                    "Initialize '" + varName + "' with a non-null instance before invoking methods on it."
                            ));
                        }
                    }
                });
            });
        });
    }

    private void checkUnreachableStatements(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(BlockStmt.class).forEach(bs -> {
            NodeList<Statement> stmts = bs.getStatements();
            for (int i = 0; i < stmts.size() - 1; i++) {
                Statement s = stmts.get(i);
                if (s.isReturnStmt() || s.isThrowStmt() || s.isBreakStmt() || s.isContinueStmt()) {
                    Statement unreachable = stmts.get(i + 1);
                    int line = unreachable.getBegin().map(p -> p.line).orElse(0);
                    issues.add(new StaticIssueDto(
                            "STATIC_UNREACHABLE_CODE",
                            "ERROR",
                            "Unreachable code detected following " + s.getClass().getSimpleName() + ".",
                            line,
                            1,
                            "Remove or relocate code that appears after return/break/throw statements."
                    ));
                    break;
                }
            }
        });
    }

    private void checkAssignmentsInConditions(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(IfStmt.class).forEach(is -> {
            if (is.getCondition().isAssignExpr()) {
                int line = is.getCondition().getBegin().map(p -> p.line).orElse(0);
                issues.add(new StaticIssueDto(
                        "STATIC_ASSIGN_IN_IF",
                        "WARNING",
                        "Assignment operator '=' used inside 'if' condition. Did you mean '=='?",
                        line,
                        1,
                        "Replace '=' with '==' or '.equals()' to perform equality comparison."
                ));
            }
        });
    }

    private void checkEmptyCatchBlocks(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(CatchClause.class).forEach(cc -> {
            if (cc.getBody().isEmpty()) {
                int line = cc.getBegin().map(p -> p.line).orElse(0);
                issues.add(new StaticIssueDto(
                        "STATIC_EMPTY_CATCH",
                        "WARNING",
                        "Empty catch block silently ignores exceptions.",
                        line,
                        1,
                        "Log the exception or handle the error appropriately rather than swallowing it."
                ));
            }
        });
    }

    private void checkUnboundedRecursion(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(MethodDeclaration.class).forEach(md -> {
            String methodName = md.getNameAsString();
            if (md.getBody().isPresent()) {
                BlockStmt body = md.getBody().get();
                List<Statement> stmts = body.getStatements();
                if (!stmts.isEmpty()) {
                    Statement firstStmt = stmts.get(0);
                    for (MethodCallExpr mce : firstStmt.findAll(MethodCallExpr.class)) {
                        if (mce.getNameAsString().equals(methodName)) {
                            int line = firstStmt.getBegin().map(p -> p.line).orElse(0);
                            issues.add(new StaticIssueDto(
                                    "STATIC_UNBOUNDED_RECURSION",
                                    "ERROR",
                                    "Method '" + methodName + "' calls itself before checking any base termination condition.",
                                    line,
                                    1,
                                    "Place a base case conditional check (e.g. if (n <= 1) return ...) before making recursive calls."
                            ));
                        }
                    }
                }
            }
        });
    }

    private void checkDivisionByZero(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(BinaryExpr.class).forEach(be -> {
            if (be.getOperator() == BinaryExpr.Operator.DIVIDE || be.getOperator() == BinaryExpr.Operator.REMAINDER) {
                Expression right = be.getRight();
                int line = be.getBegin().map(p -> p.line).orElse(0);

                if (right.isIntegerLiteralExpr() && "0".equals(right.asIntegerLiteralExpr().getValue())) {
                    issues.add(new StaticIssueDto(
                            "STATIC_DIVISION_BY_ZERO",
                            "ERROR",
                            "Division by zero detected: Expression '" + be + "' divides by literal 0, causing ArithmeticException at runtime.",
                            line,
                            1,
                            "Check divisor before division or replace divisor with a non-zero value."
                    ));
                }
            }
        });
    }

    private void checkResourceLeaks(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(MethodDeclaration.class).forEach(md -> {
            Set<String> openedScanners = new HashSet<>();
            Set<String> closedResources = new HashSet<>();

            md.findAll(VariableDeclarator.class).forEach(vd -> {
                if (vd.getTypeAsString().equals("Scanner") && vd.getInitializer().isPresent()) {
                    openedScanners.add(vd.getNameAsString());
                }
            });

            md.findAll(MethodCallExpr.class).forEach(mce -> {
                if ("close".equals(mce.getNameAsString())) {
                    mce.getScope().ifPresent(s -> {
                        if (s.isNameExpr()) {
                            closedResources.add(s.asNameExpr().getNameAsString());
                        }
                    });
                }
            });

            for (String scannerName : openedScanners) {
                if (!closedResources.contains(scannerName)) {
                    int line = md.getBegin().map(p -> p.line).orElse(0);
                    issues.add(new StaticIssueDto(
                            "STATIC_RESOURCE_LEAK",
                            "WARNING",
                            "Potential resource leak: Scanner '" + scannerName + "' is opened but never closed with '" + scannerName + ".close()'.",
                            line,
                            1,
                            "Add '" + scannerName + ".close();' at the end of the method or use try-with-resources."
                    ));
                }
            }
        });
    }

    private void checkStringIndexOutOfBounds(CompilationUnit cu, List<StaticIssueDto> issues) {
        cu.findAll(MethodCallExpr.class).forEach(mce -> {
            String name = mce.getNameAsString();
            if ("charAt".equals(name) || "substring".equals(name)) {
                mce.getArguments().forEach(arg -> {
                    if (arg.isIntegerLiteralExpr()) {
                        try {
                            int val = Integer.parseInt(arg.asIntegerLiteralExpr().getValue());
                            if (val < 0) {
                                int line = mce.getBegin().map(p -> p.line).orElse(0);
                                issues.add(new StaticIssueDto(
                                        "STATIC_STRING_INDEX_OUT_OF_BOUNDS",
                                        "ERROR",
                                        "String index out of bounds: Negative index (" + val + ") passed to '" + name + "()'.",
                                        line,
                                        1,
                                        "String indices must be non-negative (>= 0)."
                                ));
                            }
                        } catch (Exception ignored) {}
                    }
                });
            }
        });
    }

    private void checkSourceCodeRegexPatterns(String sourceCode, List<StaticIssueDto> issues) {
        String[] lines = sourceCode.split("\\r?\\n");
        Pattern scNextIntToString = Pattern.compile("String\\s+([A-Za-z0-9_]+)\\s*=\\s*[A-Za-z0-9_]+\\.nextInt\\s*\\(");
        Pattern scNextLineToInt = Pattern.compile("int\\s+([A-Za-z0-9_]+)\\s*=\\s*[A-Za-z0-9_]+\\.nextLine\\s*\\(");
        Pattern forDecrementPattern = Pattern.compile("for\\s*\\(\\s*int\\s+([a-zA-Z0-9_]+)\\s*=\\s*0\\s*;\\s*\\1\\s*<\\s*\\d+\\s*;\\s*\\1--\\s*\\)");
        Pattern offByOnePattern = Pattern.compile("for\\s*\\(.*?;\\s*([a-zA-Z0-9_]+)\\s*<=\\s*([a-zA-Z0-9_]+)\\.(size\\(\\)|length).*?;.*?\\)");
        Pattern selfAssignPattern = Pattern.compile("^\\s*([a-zA-Z0-9_]+)\\s*=\\s*\\1\\s*;?\\s*$");
        Pattern divByZeroPattern = Pattern.compile("[/|%]\\s*0(?![0-9])");

        for (int i = 0; i < lines.length; i++) {
            int lineNo = i + 1;
            String line = lines[i].trim();

            if (divByZeroPattern.matcher(line).find() && !line.startsWith("//") && !line.startsWith("/*")) {
                boolean alreadyAdded = issues.stream().anyMatch(iss -> iss.getLineNo() == lineNo && iss.getRuleId().contains("DIVISION_BY_ZERO"));
                if (!alreadyAdded) {
                    issues.add(new StaticIssueDto(
                            "STATIC_DIVISION_BY_ZERO",
                            "ERROR",
                            "Division by zero detected: Line divides or performs modulo by 0.",
                            lineNo,
                            1,
                            "Replace 0 with a non-zero divisor or add a check 'if (divisor != 0)'."
                    ));
                }
            }

            if (scNextIntToString.matcher(line).find()) {
                boolean alreadyAdded = issues.stream().anyMatch(iss -> iss.getLineNo() == lineNo && iss.getRuleId().contains("TYPE_MISMATCH"));
                if (!alreadyAdded) {
                    issues.add(new StaticIssueDto(
                            "STATIC_SCANNER_TYPE_MISMATCH",
                            "ERROR",
                            "Scanner type mismatch: 'nextInt()' returns an integer, which cannot be assigned to a String variable.",
                            lineNo,
                            1,
                            "Use 'sc.next()' or 'sc.nextLine()' to read a String name from input."
                    ));
                }
            }

            if (scNextLineToInt.matcher(line).find()) {
                boolean alreadyAdded = issues.stream().anyMatch(iss -> iss.getLineNo() == lineNo && iss.getRuleId().contains("TYPE_MISMATCH"));
                if (!alreadyAdded) {
                    issues.add(new StaticIssueDto(
                            "STATIC_SCANNER_TYPE_MISMATCH",
                            "ERROR",
                            "Scanner type mismatch: 'nextLine()' returns a String, which cannot be assigned to an integer variable.",
                            lineNo,
                            1,
                            "Use 'sc.nextInt()' to read an integer age from input."
                    ));
                }
            }

            if (forDecrementPattern.matcher(line).find()) {
                boolean alreadyAdded = issues.stream().anyMatch(iss -> iss.getLineNo() == lineNo && iss.getRuleId().contains("INFINITE"));
                if (!alreadyAdded) {
                    issues.add(new StaticIssueDto(
                            "STATIC_INFINITE_FOR_LOOP",
                            "ERROR",
                            "Infinite loop detected: Loop variable starts at 0 and is checked with '< 3', but is decremented ('i--').",
                            lineNo,
                            1,
                            "Change 'i--' to 'i++' so the loop iterates 3 times and terminates."
                    ));
                }
            }

            if (offByOnePattern.matcher(line).find()) {
                boolean alreadyAdded = issues.stream().anyMatch(iss -> iss.getLineNo() == lineNo && iss.getRuleId().contains("OFF_BY_ONE"));
                if (!alreadyAdded) {
                    issues.add(new StaticIssueDto(
                            "STATIC_OFF_BY_ONE",
                            "WARNING",
                            "Off-by-one boundary error: Using '<=' with collection size causes IndexOutOfBoundsException on the final iteration.",
                            lineNo,
                            1,
                            "Change '<=' to '<' because collection indices are zero-based [0 to size - 1]."
                    ));
                }
            }

            if (selfAssignPattern.matcher(line).find()) {
                boolean alreadyAdded = issues.stream().anyMatch(iss -> iss.getLineNo() == lineNo && iss.getRuleId().contains("SELF_ASSIGNMENT"));
                if (!alreadyAdded) {
                    String varName = line.split("=")[0].trim();
                    issues.add(new StaticIssueDto(
                            "STATIC_SELF_ASSIGNMENT_SHADOWING",
                            "ERROR",
                            "Self-assignment / parameter shadowing: '" + varName + " = " + varName + "' does not assign to the instance field.",
                            lineNo,
                            1,
                            "Change to 'this." + varName + " = " + varName + ";' to initialize the object field."
                    ));
                }
            }
        }
    }

    public String generateCorrectedCode(String sourceCode, List<StaticIssueDto> issues, List<com.traceflow.source.dto.CompilerDiagnosticDto> compilerErrors) {
        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            return "// No source code provided";
        }

        String[] rawLines = sourceCode.split("\\r?\\n");
        List<String> correctedLines = new ArrayList<>(Arrays.asList(rawLines));

        // 1. Line-by-line automated repairs
        for (int i = 0; i < correctedLines.size(); i++) {
            String line = correctedLines.get(i);
            String trimmed = line.trim();

            // Fix Scanner nextInt -> String
            if (trimmed.contains("String") && trimmed.contains(".nextInt()")) {
                line = line.replace(".nextInt()", ".nextLine()");
            }
            // Fix Scanner nextLine -> int
            if (trimmed.contains("int ") && trimmed.contains(".nextLine()")) {
                line = line.replace(".nextLine()", ".nextInt()");
            }
            // Fix infinite loop i-- to i++
            if (trimmed.matches(".*for\\s*\\(.*?;.*?<.*?;\\s*[a-zA-Z0-9_]+--\\s*\\).*")) {
                line = line.replaceAll("([a-zA-Z0-9_]+)--", "$1++");
            }
            // Fix off-by-one <= size() or <= length
            if (trimmed.matches(".*<=\\s*[a-zA-Z0-9_]+(\\.(size\\(\\)|length)).*")) {
                line = line.replaceAll("<=\\s*([a-zA-Z0-9_]+(\\.(size\\(\\)|length)))", "< $1");
            }
            // Fix parameter shadowing self-assignment: name = name; -> this.name = name;
            if (trimmed.matches("^\\s*([a-zA-Z0-9_]+)\\s*=\\s*\\1\\s*;?\\s*$")) {
                String v = trimmed.split("=")[0].trim();
                line = line.replace(v + " = " + v, "this." + v + " = " + v);
                if (!line.endsWith(";")) line += ";";
            }
            // Fix division by zero literal: / 0 -> / (b != 0 ? b : 1) or / 1
            if (trimmed.matches(".*[/|%]\\s*0\\s*;.*")) {
                line = line.replaceAll("([/|%])\\s*0\\s*;", "$1 1; // Corrected: replaced division by zero with safe divisor");
            }
            // Fix null pointer initialization: String str = null; -> String str = "";
            if (trimmed.matches(".*String\\s+([a-zA-Z0-9_]+)\\s*=\\s*null\\s*;.*")) {
                line = line.replace("null", "\"\"");
            }
            // Fix integer division truncation in double calc
            if (trimmed.startsWith("return ") && trimmed.contains("/") && !trimmed.contains("(double)")) {
                line = line.replace("return ", "return (double) ");
            }
            // Fix empty return in non-void method: return; -> return 0;
            if (trimmed.equals("return;")) {
                line = line.replace("return;", "return 0;");
            }

            correctedLines.set(i, line);
        }

        // 2. Fix missing closing braces / brackets
        int openBraces = 0;
        int closeBraces = 0;
        for (String l : correctedLines) {
            for (char c : l.toCharArray()) {
                if (c == '{') openBraces++;
                if (c == '}') closeBraces++;
            }
        }
        while (closeBraces < openBraces) {
            correctedLines.add("}");
            closeBraces++;
        }

        return String.join("\n", correctedLines);
    }
}
