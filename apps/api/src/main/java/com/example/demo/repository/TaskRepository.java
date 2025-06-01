package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Project;
import com.example.demo.model.Task;
import com.example.demo.model.User;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject(Project project);
    List<Task> findByProjectId(Long projectId);
    List<Task> findByAssignee(User assignee);
    
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.project LEFT JOIN FETCH t.assignee WHERE t.id = :id")
    Optional<Task> findByIdWithRelationships(@Param("id") Long id);
    
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.project LEFT JOIN FETCH t.assignee WHERE t.project = :project")
    List<Task> findByProjectWithRelationships(@Param("project") Project project);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Task t WHERE t.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
    
    @Modifying
    @Transactional
    @Query("UPDATE Task t SET t.assignee = null WHERE t.project.id = :projectId")
    void clearAssigneesByProjectId(@Param("projectId") Long projectId);
}
