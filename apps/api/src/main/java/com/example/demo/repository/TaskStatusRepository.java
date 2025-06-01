package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Project;
import com.example.demo.model.TaskStatus;

@Repository
public interface TaskStatusRepository extends JpaRepository<TaskStatus, Long> {
    
    List<TaskStatus> findByProjectOrderByOrderIndexAsc(Project project);
    
    List<TaskStatus> findByProjectIdOrderByOrderIndexAsc(Long projectId);
    
    Optional<TaskStatus> findByProjectAndIsDefaultTrue(Project project);
    
    Optional<TaskStatus> findByProjectIdAndIsDefaultTrue(Long projectId);
    
    Optional<TaskStatus> findByProjectAndName(Project project, String name);
    
    boolean existsByProjectAndName(Project project, String name);
    
    @Query("SELECT COUNT(ts) FROM TaskStatus ts WHERE ts.project.id = :projectId")
    long countByProjectId(@Param("projectId") Long projectId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM TaskStatus ts WHERE ts.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
}
