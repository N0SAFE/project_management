package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.Project;
import com.example.demo.model.Task;
import com.example.demo.model.User;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject(Project project);
    List<Task> findByAssignee(User assignee);
    
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.project LEFT JOIN FETCH t.assignee WHERE t.id = :id")
    Optional<Task> findByIdWithRelationships(@Param("id") Long id);
    
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.project LEFT JOIN FETCH t.assignee WHERE t.project = :project")
    List<Task> findByProjectWithRelationships(@Param("project") Project project);
}
