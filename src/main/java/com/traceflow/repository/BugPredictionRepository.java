package com.traceflow.repository;

import com.traceflow.model.Analysis;
import com.traceflow.model.BugPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BugPredictionRepository extends JpaRepository<BugPrediction, Long> {
    Optional<BugPrediction> findByAnalysis(Analysis analysis);
    Optional<BugPrediction> findByAnalysisId(Long analysisId);
    void deleteByAnalysisId(Long analysisId);
}
