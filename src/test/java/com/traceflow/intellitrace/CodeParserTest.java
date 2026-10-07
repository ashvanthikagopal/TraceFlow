package com.traceflow.intellitrace;

import com.traceflow.intellitrace.model.ExecutionStep;
import com.traceflow.intellitrace.model.Variable;
import com.traceflow.intellitrace.parser.CodeParser;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

public class CodeParserTest {

    @Test
    public void testVariableParsingAndExpressionEvaluation() {
        CodeParser parser = new CodeParser();
        ArrayList<String> lines = new ArrayList<>(Arrays.asList(
                "int a = 10;",
                "int b = 20;",
                "int c = a + b;",
                "int product = a * b;",
                "double avg = (a + b) / 2.0;",
                "String name = \"TraceFlow\";",
                "boolean flag = true;"
        ));

        ArrayList<Variable> vars = parser.parseVariables(lines);
        assertEquals(7, vars.size());

        assertEquals("a", vars.get(0).getName());
        assertEquals("10", vars.get(0).getValue());

        assertEquals("b", vars.get(1).getName());
        assertEquals("20", vars.get(1).getValue());

        assertEquals("c", vars.get(2).getName());
        assertEquals("30", vars.get(2).getValue()); // Expression evaluated: 10 + 20 = 30!

        assertEquals("product", vars.get(3).getName());
        assertEquals("200", vars.get(3).getValue()); // Expression evaluated: 10 * 20 = 200!

        assertEquals("avg", vars.get(4).getName());
        assertEquals("15.0", vars.get(4).getValue()); // Expression evaluated: (10 + 20) / 2.0 = 15.0!

        assertEquals("name", vars.get(5).getName());
        assertEquals("\"TraceFlow\"", vars.get(5).getValue());

        assertEquals("flag", vars.get(6).getName());
        assertEquals("true", vars.get(6).getValue());
    }

    @Test
    public void testTimelineCategorization() {
        CodeParser parser = new CodeParser();
        ArrayList<String> lines = new ArrayList<>(Arrays.asList(
                "public class Demo {",
                "    public static void main(String[] args) {",
                "        int x = 5;",
                "        if (x > 2) {",
                "            System.out.println(\"x is large: \" + x);",
                "        }",
                "        for (int i = 0; i < 3; i++) {",
                "            System.out.println(\"i: \" + i);",
                "        }",
                "        while (x > 0) {",
                "            x = x - 1;",
                "        }",
                "        return;",
                "    }",
                "}"
        ));

        ArrayList<ExecutionStep> steps = parser.generateTimeline(lines);
        assertFalse(steps.isEmpty());

        boolean hasMethod = steps.stream().anyMatch(s -> "Method Declaration".equals(s.getCategory()));
        boolean hasVar = steps.stream().anyMatch(s -> "Variable Declaration".equals(s.getCategory()));
        boolean hasIf = steps.stream().anyMatch(s -> "If Condition".equals(s.getCategory()));
        boolean hasFor = steps.stream().anyMatch(s -> "For Loop".equals(s.getCategory()));
        boolean hasWhile = steps.stream().anyMatch(s -> "While Loop".equals(s.getCategory()));
        boolean hasPrint = steps.stream().anyMatch(s -> "Output Statement".equals(s.getCategory()));
        boolean hasReturn = steps.stream().anyMatch(s -> "Return Statement".equals(s.getCategory()));

        assertTrue(hasMethod, "Should detect Method Declaration");
        assertTrue(hasVar, "Should detect Variable Declaration");
        assertTrue(hasIf, "Should detect If Condition");
        assertTrue(hasFor, "Should detect For Loop");
        assertTrue(hasWhile, "Should detect While Loop");
        assertTrue(hasPrint, "Should detect Output Statement");
        assertTrue(hasReturn, "Should detect Return Statement");
    }
}
