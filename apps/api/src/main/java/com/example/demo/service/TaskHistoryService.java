package com.example.demo.service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Task;
import com.example.demo.model.TaskHistory;
import com.example.demo.model.TaskHistory.HistoryAction;
import com.example.demo.model.User;
import com.example.demo.repository.TaskHistoryRepository;

@Service
@Transactional
public class TaskHistoryService {

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    /**
     * Record a task creation event
     */
    public void recordTaskCreation(Task task, User createdBy) {
        TaskHistory history = new TaskHistory(
            task, 
            createdBy, 
            HistoryAction.CREATE, 
            "task",
            null, 
            "Task created", 
            "New task created with initial data"
        );
        taskHistoryRepository.save(history);
    }

    /**
     * Record task field changes by comparing old and new values
     */
    public void recordTaskUpdate(Task oldTask, Task newTask, User modifiedBy) {
        // Record name changes
        if (!Objects.equals(oldTask.getName(), newTask.getName())) {
            recordFieldChange(newTask, modifiedBy, HistoryAction.UPDATE, "name", 
                            oldTask.getName(), newTask.getName());
        }

        // Record description changes
        if (!Objects.equals(oldTask.getDescription(), newTask.getDescription())) {
            recordFieldChange(newTask, modifiedBy, HistoryAction.UPDATE, "description", 
                            oldTask.getDescription(), newTask.getDescription());
        }

        // Record due date changes
        if (!Objects.equals(oldTask.getDueDate(), newTask.getDueDate())) {
            String oldDate = oldTask.getDueDate() != null ? oldTask.getDueDate().toString() : null;
            String newDate = newTask.getDueDate() != null ? newTask.getDueDate().toString() : null;
            recordFieldChange(newTask, modifiedBy, HistoryAction.UPDATE, "dueDate", oldDate, newDate);
        }

        // Record assignee changes
        if (!Objects.equals(getAssigneeId(oldTask), getAssigneeId(newTask))) {
            String oldAssignee = getAssigneeName(oldTask);
            String newAssignee = getAssigneeName(newTask);
            HistoryAction action = newTask.getAssignee() != null ? HistoryAction.ASSIGN : HistoryAction.UNASSIGN;
            recordFieldChange(newTask, modifiedBy, action, "assignee", oldAssignee, newAssignee);
        }

        // Record status changes
        if (!Objects.equals(getStatusId(oldTask), getStatusId(newTask))) {
            String oldStatus = getStatusName(oldTask);
            String newStatus = getStatusName(newTask);
            recordFieldChange(newTask, modifiedBy, HistoryAction.STATUS_CHANGE, "status", oldStatus, newStatus);
        }

        // Record priority changes
        if (!Objects.equals(getPriorityId(oldTask), getPriorityId(newTask))) {
            String oldPriority = getPriorityName(oldTask);
            String newPriority = getPriorityName(newTask);
            recordFieldChange(newTask, modifiedBy, HistoryAction.PRIORITY_CHANGE, "priority", oldPriority, newPriority);
        }
    }

    /**
     * Record task deletion
     */
    public void recordTaskDeletion(Task task, User deletedBy) {
        TaskHistory history = new TaskHistory(
            task, 
            deletedBy, 
            HistoryAction.DELETE, 
            "task",
            "Task existed", 
            null, 
            "Task deleted"
        );
        taskHistoryRepository.save(history);
    }

    /**
     * Get complete history for a task
     */
    @Transactional(readOnly = true)
    public List<TaskHistory> getTaskHistory(Long taskId) {
        return taskHistoryRepository.findByTaskIdOrderByTimestampDesc(taskId);
    }

    /**
     * Get paginated history for a task
     */
    @Transactional(readOnly = true)
    public Page<TaskHistory> getTaskHistory(Long taskId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return taskHistoryRepository.findByTaskIdOrderByTimestampDesc(taskId, pageable);
    }

    /**
     * Get project-wide task history
     */
    @Transactional(readOnly = true)
    public List<TaskHistory> getProjectHistory(Long projectId) {
        return taskHistoryRepository.findByProjectIdOrderByTimestampDesc(projectId);
    }

    /**
     * Get paginated project-wide task history
     */
    @Transactional(readOnly = true)
    public Page<TaskHistory> getProjectHistory(Long projectId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return taskHistoryRepository.findByProjectIdOrderByTimestampDesc(projectId, pageable);
    }

    /**
     * Get recent activity for a project (last 50 entries)
     */
    @Transactional(readOnly = true)
    public List<TaskHistory> getRecentProjectActivity(Long projectId) {
        Pageable pageable = PageRequest.of(0, 50);
        return taskHistoryRepository.findRecentHistoryByProjectId(projectId, pageable);
    }

    // Helper methods for safe field access

    private void recordFieldChange(Task task, User modifiedBy, HistoryAction action, 
                                 String fieldName, String oldValue, String newValue) {
        TaskHistory history = new TaskHistory(
            task, 
            modifiedBy, 
            action, 
            fieldName,
            oldValue, 
            newValue, 
            null
        );
        taskHistoryRepository.save(history);
    }

    private Long getAssigneeId(Task task) {
        return task.getAssignee() != null ? task.getAssignee().getId() : null;
    }

    private String getAssigneeName(Task task) {
        return task.getAssignee() != null ? task.getAssignee().getUsername() : null;
    }

    private Long getStatusId(Task task) {
        return task.getStatus() != null ? task.getStatus().getId() : null;
    }

    private String getStatusName(Task task) {
        return task.getStatus() != null ? task.getStatus().getName() : null;
    }

    private Long getPriorityId(Task task) {
        return task.getPriority() != null ? task.getPriority().getId() : null;
    }

    private String getPriorityName(Task task) {
        return task.getPriority() != null ? task.getPriority().getName() : null;
    }
}
