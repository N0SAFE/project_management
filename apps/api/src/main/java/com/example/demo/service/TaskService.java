package com.example.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.Project;
import com.example.demo.model.Task;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.TaskPriorityRepository;
import com.example.demo.repository.TaskStatusRepository;
import com.example.demo.repository.UserRepository;

@Service
public class TaskService {
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TaskPriorityRepository taskPriorityRepository;
    @Autowired
    private TaskStatusRepository taskStatusRepository;
    @Autowired
    private TaskHistoryService taskHistoryService;

    public Task createTask(Long projectId, String name, String description, String dueDate, Long priorityId, Long statusId, Long assigneeId, User createdBy) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new IllegalArgumentException("Project not found"));
        User assignee = null;
        if (assigneeId != null) {
            assignee = userRepository.findById(assigneeId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        }
        
        Task task = new Task();
        task.setProject(project);
        task.setName(name);
        task.setDescription(description);
        if (dueDate != null) task.setDueDate(java.time.LocalDate.parse(dueDate));
        
        // Set priority - use default if not specified
        if (priorityId != null) {
            TaskPriority priority = taskPriorityRepository.findById(priorityId)
                .orElseThrow(() -> new IllegalArgumentException("Priority not found"));
            task.setPriority(priority);
        } else {
            // Use default priority for the project
            TaskPriority defaultPriority = taskPriorityRepository.findByProjectAndIsDefaultTrue(project)
                .orElse(null);
            task.setPriority(defaultPriority);
        }
        
        // Set status - use specified or default
        if (statusId != null) {
            TaskStatus status = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("Status not found"));
            task.setStatus(status);
        } else {
            // Use default status for the project
            TaskStatus defaultStatus = taskStatusRepository.findByProjectAndIsDefaultTrue(project)
                .orElse(null);
            task.setStatus(defaultStatus);
        }
        
        task.setAssignee(assignee);
        task = taskRepository.save(task);
        
        // Record task creation in history
        taskHistoryService.recordTaskCreation(task, createdBy);
        
        return task;
    }

    public Optional<Task> getTask(Long id) {
        return taskRepository.findByIdWithRelationships(id);
    }

    public List<Task> getTasksByProject(Long projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new IllegalArgumentException("Project not found"));
        return taskRepository.findByProjectWithRelationships(project);
    }

    public Task updateTask(Long taskId, String name, String description, String dueDate, Long priorityId, Long statusId, Long assigneeId, User modifiedBy) {
        Task oldTask = taskRepository.findByIdWithRelationships(taskId).orElseThrow(() -> new IllegalArgumentException("Task not found"));
        
        // Create a copy of the old task for history comparison
        Task taskCopy = new Task();
        taskCopy.setId(oldTask.getId());
        taskCopy.setName(oldTask.getName());
        taskCopy.setDescription(oldTask.getDescription());
        taskCopy.setDueDate(oldTask.getDueDate());
        taskCopy.setPriority(oldTask.getPriority());
        taskCopy.setStatus(oldTask.getStatus());
        taskCopy.setAssignee(oldTask.getAssignee());
        taskCopy.setProject(oldTask.getProject());
        
        // Apply updates
        if (name != null) oldTask.setName(name);
        if (description != null) oldTask.setDescription(description);
        if (dueDate != null) oldTask.setDueDate(java.time.LocalDate.parse(dueDate));
        
        if (priorityId != null) {
            TaskPriority priority = taskPriorityRepository.findById(priorityId)
                .orElseThrow(() -> new IllegalArgumentException("Priority not found"));
            oldTask.setPriority(priority);
        }
        
        if (statusId != null) {
            TaskStatus status = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("Status not found"));
            oldTask.setStatus(status);
        }
        
        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId).orElseThrow(() -> new IllegalArgumentException("User not found"));
            oldTask.setAssignee(assignee);
        }
        
        Task updatedTask = taskRepository.save(oldTask);
        
        // Record changes in history
        taskHistoryService.recordTaskUpdate(taskCopy, updatedTask, modifiedBy);
        
        return updatedTask;
    }

    public void deleteTask(Long taskId, User deletedBy) {
        Task task = taskRepository.findByIdWithRelationships(taskId).orElseThrow(() -> new IllegalArgumentException("Task not found"));
        
        // Record deletion in history before deleting
        taskHistoryService.recordTaskDeletion(task, deletedBy);
        
        taskRepository.deleteById(taskId);
    }
}
