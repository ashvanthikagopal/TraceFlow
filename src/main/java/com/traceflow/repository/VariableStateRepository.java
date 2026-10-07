package com.traceflow.repository;

import com.traceflow.model.TraceEvent;
import com.traceflow.model.VariableState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VariableStateRepository extends JpaRepository<VariableState, Long> {
    List<VariableState> findByTraceEvent(TraceEvent traceEvent);
    List<VariableState> findByTraceEventId(Long traceEventId);

    @Query("SELECT v FROM VariableState v WHERE v.traceEvent.analysis.id = :analysisId ORDER BY v.traceEvent.stepNo ASC")
    List<VariableState> findAllByAnalysisId(@Param("analysisId") Long analysisId);
}
