package com.traceflow.repository;

import com.traceflow.model.Analysis;
import com.traceflow.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    List<Analysis> findByProjectOrderByStartedAtDesc(Project project);
    List<Analysis> findByProjectIdOrderByStartedAtDesc(Long projectId);
    Optional<Analysis> findFirstByProjectIdOrderByStartedAtDesc(Long projectId);
    List<Analysis> findByProjectUserIdOrderByStartedAtDesc(Long userId);
}
