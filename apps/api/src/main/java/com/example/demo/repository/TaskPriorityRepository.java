package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Project;
import com.example.demo.model.TaskPriority;

@Repository
public interface TaskPriorityRepository extends JpaRepository<TaskPriority, Long> {
    
    List<TaskPriority> findByProjectOrderByLevelDesc(Project project);
    
    List<TaskPriority> findByProjectIdOrderByLevelDesc(Long projectId);
    
    Optional<TaskPriority> findByProjectAndIsDefaultTrue(Project project);
    
    Optional<TaskPriority> findByProjectIdAndIsDefaultTrue(Long projectId);
    
    Optional<TaskPriority> findByProjectAndName(Project project, String name);
    
    boolean existsByProjectAndName(Project project, String name);
    
    @Query("SELECT COUNT(tp) FROM TaskPriority tp WHERE tp.project.id = :projectId")
    long countByProjectId(@Param("projectId") Long projectId);
}
