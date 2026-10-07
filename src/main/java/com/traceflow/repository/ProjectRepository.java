package com.traceflow.repository;

import com.traceflow.model.Project;
import com.traceflow.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUserOrderByCreatedAtDesc(User user);
    List<Project> findByUserIdOrderByCreatedAtDesc(Long userId);
}
