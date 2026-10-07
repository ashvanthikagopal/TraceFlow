package com.traceflow.source.dto;

public class FeatureVectorDto {
    private double loopIterationCount;
    private double loopControlMutations;
    private double conditionRepeatCount;
    private double variableMutationFrequency;
    private double recursionDepth;
    private double methodCallCount;
    private double exceptionCount;
    private double nullAccessCount;
    private double executionSteps;
    private double executionDuration;
    private double syntaxErrorCount;
    private double typeMismatchCount;
    private double arithmeticRiskCount;
    private double resourceLeakCount;
    private double logicalBugCount;
    private double cyclomaticComplexity;
    private double codeLinesCount;

    public FeatureVectorDto() {}

    public FeatureVectorDto(double loopIterationCount, double loopControlMutations, double conditionRepeatCount,
                            double variableMutationFrequency, double recursionDepth, double methodCallCount,
                            double exceptionCount, double nullAccessCount, double executionSteps, double executionDuration) {
        this.loopIterationCount = loopIterationCount;
        this.loopControlMutations = loopControlMutations;
        this.conditionRepeatCount = conditionRepeatCount;
        this.variableMutationFrequency = variableMutationFrequency;
        this.recursionDepth = recursionDepth;
        this.methodCallCount = methodCallCount;
        this.exceptionCount = exceptionCount;
        this.nullAccessCount = nullAccessCount;
        this.executionSteps = executionSteps;
        this.executionDuration = executionDuration;
        this.syntaxErrorCount = 0;
        this.typeMismatchCount = 0;
        this.arithmeticRiskCount = 0;
        this.resourceLeakCount = 0;
        this.logicalBugCount = 0;
        this.cyclomaticComplexity = 1;
        this.codeLinesCount = 1;
    }

    public FeatureVectorDto(double loopIterationCount, double loopControlMutations, double conditionRepeatCount,
                            double variableMutationFrequency, double recursionDepth, double methodCallCount,
                            double exceptionCount, double nullAccessCount, double executionSteps, double executionDuration,
                            double syntaxErrorCount, double typeMismatchCount, double arithmeticRiskCount,
                            double resourceLeakCount, double logicalBugCount, double cyclomaticComplexity, double codeLinesCount) {
        this.loopIterationCount = loopIterationCount;
        this.loopControlMutations = loopControlMutations;
        this.conditionRepeatCount = conditionRepeatCount;
        this.variableMutationFrequency = variableMutationFrequency;
        this.recursionDepth = recursionDepth;
        this.methodCallCount = methodCallCount;
        this.exceptionCount = exceptionCount;
        this.nullAccessCount = nullAccessCount;
        this.executionSteps = executionSteps;
        this.executionDuration = executionDuration;
        this.syntaxErrorCount = syntaxErrorCount;
        this.typeMismatchCount = typeMismatchCount;
        this.arithmeticRiskCount = arithmeticRiskCount;
        this.resourceLeakCount = resourceLeakCount;
        this.logicalBugCount = logicalBugCount;
        this.cyclomaticComplexity = cyclomaticComplexity;
        this.codeLinesCount = codeLinesCount;
    }

    public double[] toArray() {
        return new double[]{
                loopIterationCount,
                loopControlMutations,
                conditionRepeatCount,
                variableMutationFrequency,
                recursionDepth,
                methodCallCount,
                exceptionCount,
                nullAccessCount,
                executionSteps,
                executionDuration,
                syntaxErrorCount,
                typeMismatchCount,
                arithmeticRiskCount,
                resourceLeakCount,
                logicalBugCount,
                cyclomaticComplexity,
                codeLinesCount
        };
    }

    public double getLoopIterationCount() {
        return loopIterationCount;
    }

    public void setLoopIterationCount(double loopIterationCount) {
        this.loopIterationCount = loopIterationCount;
    }

    public double getLoopControlMutations() {
        return loopControlMutations;
    }

    public void setLoopControlMutations(double loopControlMutations) {
        this.loopControlMutations = loopControlMutations;
    }

    public double getConditionRepeatCount() {
        return conditionRepeatCount;
    }

    public void setConditionRepeatCount(double conditionRepeatCount) {
        this.conditionRepeatCount = conditionRepeatCount;
    }

    public double getVariableMutationFrequency() {
        return variableMutationFrequency;
    }

    public void setVariableMutationFrequency(double variableMutationFrequency) {
        this.variableMutationFrequency = variableMutationFrequency;
    }

    public double getRecursionDepth() {
        return recursionDepth;
    }

    public void setRecursionDepth(double recursionDepth) {
        this.recursionDepth = recursionDepth;
    }

    public double getMethodCallCount() {
        return methodCallCount;
    }

    public void setMethodCallCount(double methodCallCount) {
        this.methodCallCount = methodCallCount;
    }

    public double getExceptionCount() {
        return exceptionCount;
    }

    public void setExceptionCount(double exceptionCount) {
        this.exceptionCount = exceptionCount;
    }

    public double getNullAccessCount() {
        return nullAccessCount;
    }

    public void setNullAccessCount(double nullAccessCount) {
        this.nullAccessCount = nullAccessCount;
    }

    public double getExecutionSteps() {
        return executionSteps;
    }

    public void setExecutionSteps(double executionSteps) {
        this.executionSteps = executionSteps;
    }

    public double getExecutionDuration() {
        return executionDuration;
    }

    public void setExecutionDuration(double executionDuration) {
        this.executionDuration = executionDuration;
    }

    public double getSyntaxErrorCount() {
        return syntaxErrorCount;
    }

    public void setSyntaxErrorCount(double syntaxErrorCount) {
        this.syntaxErrorCount = syntaxErrorCount;
    }

    public double getTypeMismatchCount() {
        return typeMismatchCount;
    }

    public void setTypeMismatchCount(double typeMismatchCount) {
        this.typeMismatchCount = typeMismatchCount;
    }

    public double getArithmeticRiskCount() {
        return arithmeticRiskCount;
    }

    public void setArithmeticRiskCount(double arithmeticRiskCount) {
        this.arithmeticRiskCount = arithmeticRiskCount;
    }

    public double getResourceLeakCount() {
        return resourceLeakCount;
    }

    public void setResourceLeakCount(double resourceLeakCount) {
        this.resourceLeakCount = resourceLeakCount;
    }

    public double getLogicalBugCount() {
        return logicalBugCount;
    }

    public void setLogicalBugCount(double logicalBugCount) {
        this.logicalBugCount = logicalBugCount;
    }

    public double getCyclomaticComplexity() {
        return cyclomaticComplexity;
    }

    public void setCyclomaticComplexity(double cyclomaticComplexity) {
        this.cyclomaticComplexity = cyclomaticComplexity;
    }

    public double getCodeLinesCount() {
        return codeLinesCount;
    }

    public void setCodeLinesCount(double codeLinesCount) {
        this.codeLinesCount = codeLinesCount;
    }
}

