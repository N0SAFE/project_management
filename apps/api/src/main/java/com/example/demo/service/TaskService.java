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

    public Task createTask(Long projectId, String name, String description, String dueDate, Long priorityId, Long statusId, Long assigneeId) {
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
        return taskRepository.save(task);
    }

    public Optional<Task> getTask(Long id) {
        return taskRepository.findByIdWithRelationships(id);
    }

    public List<Task> getTasksByProject(Long projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new IllegalArgumentException("Project not found"));
        return taskRepository.findByProjectWithRelationships(project);
    }

    public Task updateTask(Long taskId, String name, String description, String dueDate, Long priorityId, Long statusId, Long assigneeId) {
        Task task = taskRepository.findByIdWithRelationships(taskId).orElseThrow(() -> new IllegalArgumentException("Task not found"));
        if (name != null) task.setName(name);
        if (description != null) task.setDescription(description);
        if (dueDate != null) task.setDueDate(java.time.LocalDate.parse(dueDate));
        
        if (priorityId != null) {
            TaskPriority priority = taskPriorityRepository.findById(priorityId)
                .orElseThrow(() -> new IllegalArgumentException("Priority not found"));
            task.setPriority(priority);
        }
        
        if (statusId != null) {
            TaskStatus status = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalArgumentException("Status not found"));
            task.setStatus(status);
        }
        
        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId).orElseThrow(() -> new IllegalArgumentException("User not found"));
            task.setAssignee(assignee);
        }
        return taskRepository.save(task);
    }

    public void deleteTask(Long taskId) {
        taskRepository.deleteById(taskId);
    }
}
