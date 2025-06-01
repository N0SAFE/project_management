package com.example.demo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.TaskHistory;

@Repository
public interface TaskHistoryRepository extends JpaRepository<TaskHistory, Long> {
    
    /**
     * Find all history entries for a specific task, ordered by timestamp descending
     */
    List<TaskHistory> findByTaskIdOrderByTimestampDesc(Long taskId);
    
    /**
     * Find paginated history entries for a specific task
     */
    Page<TaskHistory> findByTaskIdOrderByTimestampDesc(Long taskId, Pageable pageable);
    
    /**
     * Find all history entries for tasks in a specific project
     */
    @Query("SELECT th FROM TaskHistory th WHERE th.task.project.id = :projectId ORDER BY th.timestamp DESC")
    List<TaskHistory> findByProjectIdOrderByTimestampDesc(@Param("projectId") Long projectId);
    
    /**
     * Find paginated history entries for tasks in a specific project
     */
    @Query("SELECT th FROM TaskHistory th WHERE th.task.project.id = :projectId ORDER BY th.timestamp DESC")
    Page<TaskHistory> findByProjectIdOrderByTimestampDesc(@Param("projectId") Long projectId, Pageable pageable);
    
    /**
     * Find history entries by specific action type for a task
     */
    List<TaskHistory> findByTaskIdAndActionOrderByTimestampDesc(Long taskId, TaskHistory.HistoryAction action);
    
    /**
     * Find history entries modified by a specific user for a task
     */
    List<TaskHistory> findByTaskIdAndModifiedByIdOrderByTimestampDesc(Long taskId, Long userId);
    
    /**
     * Count total history entries for a task
     */
    long countByTaskId(Long taskId);
    
    /**
     * Delete all history entries for a specific task
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM TaskHistory th WHERE th.task.id = :taskId")
    void deleteByTaskId(@Param("taskId") Long taskId);
    
    /**
     * Delete all history entries for tasks in a specific project
     */
    @Modifying
    @Query("DELETE FROM TaskHistory th WHERE th.task.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
    
    /**
     * Find recent history entries for a project (last N entries)
     */
    @Query("SELECT th FROM TaskHistory th WHERE th.task.project.id = :projectId ORDER BY th.timestamp DESC")
    List<TaskHistory> findRecentHistoryByProjectId(@Param("projectId") Long projectId, Pageable pageable);
}
