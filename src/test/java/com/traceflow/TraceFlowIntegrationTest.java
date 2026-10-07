package com.traceflow;

import com.github.javaparser.ast.CompilationUnit;
import com.traceflow.parser.ControlFlowAnalyzer;
import com.traceflow.parser.JavaSourceParser;
import com.traceflow.parser.StaticIssueDetector;
import com.traceflow.service.*;
import com.traceflow.source.dto.FeatureVectorDto;
import com.traceflow.source.dto.FlowGraphDto;
import com.traceflow.source.dto.StaticIssueDto;
import com.traceflow.util.FileUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2")
public class TraceFlowIntegrationTest {

    @Autowired
    private JavaSourceParser javaSourceParser;

    @Autowired
    private StaticIssueDetector staticIssueDetector;

    @Autowired
    private ControlFlowAnalyzer controlFlowAnalyzer;

    @Autowired
    private CompilationService compilationService;

    @Autowired
    private DebugService debugService;

    @Autowired
    private MlService mlService;

    @Test
    public void testJavaParsingAndStaticAnalysis() {
        String code = """
                public class TestInfinite {
                    public static void main(String[] args) {
                        int count = 0;
                        while (true) {
                            count++;
                        }
                    }
                }
                """;

        Optional<CompilationUnit> cuOpt = javaSourceParser.parseToCompilationUnit(code);
        assertTrue(cuOpt.isPresent(), "AST should parse successfully");

        List<StaticIssueDto> issues = staticIssueDetector.detectIssues(cuOpt.get());
        assertFalse(issues.isEmpty(), "Should detect infinite loop static issue");
        assertTrue(issues.stream().anyMatch(i -> i.getRuleId().contains("INFINITE")), "Should flag infinite loop rule");

        FlowGraphDto flowGraph = controlFlowAnalyzer.buildFlowGraph(cuOpt.get());
        assertNotNull(flowGraph);
        assertFalse(flowGraph.getNodes().isEmpty(), "Flowchart nodes should not be empty");
        assertFalse(flowGraph.getEdges().isEmpty(), "Flowchart edges should not be empty");
    }

    @Test
    public void testCompilationAndJdiTracing(@TempDir Path tempDir) throws Exception {
        String normalCode = """
                public class BubbleSort {
                    public static void main(String[] args) {
                        int[] arr = {5, 2, 8, 1, 9};
                        int n = arr.length;
                        for (int i = 0; i < n - 1; i++) {
                            for (int j = 0; j < n - i - 1; j++) {
                                if (arr[j] > arr[j + 1]) {
                                    int temp = arr[j];
                                    arr[j] = arr[j + 1];
                                    arr[j + 1] = temp;
                                }
                            }
                        }
                        System.out.println("Sorted: " + arr[0]);
                    }
                }
                """;

        Path sourceFile = FileUtil.writeSourceFile(tempDir, "BubbleSort.java", normalCode);
        CompilationService.CompilationResult compResult = compilationService.compileJavaFile(sourceFile);
        assertTrue(compResult.isSuccess(), "BubbleSort should compile cleanly");

        DebugService.DebugExecutionResult execResult = debugService.traceExecution(compResult.getOutputDir(), "BubbleSort");
        assertNotNull(execResult);
        assertTrue(execResult.getSteps().size() >= 30, "Trace steps should be recorded by JDI (expected >= 30 steps)");
        assertNull(execResult.getExceptionMessage(), "BubbleSort should not throw runtime exception");
        assertFalse(execResult.isHitMaxSteps(), "Normal bubble sort should not hit max step limit");
    }

    @Test
    public void testMlPrediction() {
        mlService.trainAndSaveModel();
        assertNotNull(mlService);
    }
}
