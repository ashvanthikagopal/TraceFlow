package com.traceflow.repository;

import com.traceflow.model.Analysis;
import com.traceflow.model.TraceEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TraceRepository extends JpaRepository<TraceEvent, Long> {
    List<TraceEvent> findByAnalysisOrderByStepNoAsc(Analysis analysis);
    List<TraceEvent> findByAnalysisIdOrderByStepNoAsc(Long analysisId);
    void deleteByAnalysisId(Long analysisId);
}
