package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Project;
import com.example.demo.model.Task;
import com.example.demo.model.TaskHistory;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.ProjectService;
import com.example.demo.service.TaskHistoryService;
import com.example.demo.service.TaskService;

@RestController
@RequestMapping("/api")
public class TaskHistoryController {
    
    @Autowired
    private TaskHistoryService taskHistoryService;
    
    @Autowired
    private TaskService taskService;
    
    @Autowired
    private ProjectService projectService;
    
    @Autowired
    private ProjectMemberRepository projectMemberRepository;
    
    /**
     * Get history for a specific task
     * US012: En tant qu'administrateur, membre ou observateur, je veux pouvoir suivre l'historique des modifications apportées aux tâches.
     */
    @GetMapping("/tasks/{taskId}/history")
    public ResponseEntity<?> getTaskHistory(
            @PathVariable Long taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        
        try {
            // Get user from authentication
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Get task and verify user has access
            Task task = taskService.getTask(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));
            
            Project project = task.getProject();
            
            // Check if user is a member of the project (admin, member, or observer)
            var memberOpt = projectMemberRepository.findByProjectAndUser(project, user);
            if (memberOpt.isEmpty()) {
                return ResponseEntity.status(403).body("Permission denied: You are not a member of this project");
            }
            
            // Get task history
            if (size > 0) {
                Page<TaskHistory> historyPage = taskHistoryService.getTaskHistory(taskId, page, size);
                return ResponseEntity.ok(historyPage);
            } else {
                List<TaskHistory> history = taskHistoryService.getTaskHistory(taskId);
                return ResponseEntity.ok(history);
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Get project-wide task history
     */
    @GetMapping("/projects/{projectId}/tasks/history")
    public ResponseEntity<?> getProjectTaskHistory(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {
        
        try {
            // Get user from authentication
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Get project and verify user has access
            Project project = projectService.getProject(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            
            // Check if user is a member of the project
            var memberOpt = projectMemberRepository.findByProjectAndUser(project, user);
            if (memberOpt.isEmpty()) {
                return ResponseEntity.status(403).body("Permission denied: You are not a member of this project");
            }
            
            // Get project task history
            if (size > 0) {
                Page<TaskHistory> historyPage = taskHistoryService.getProjectHistory(projectId, page, size);
                return ResponseEntity.ok(historyPage);
            } else {
                List<TaskHistory> history = taskHistoryService.getProjectHistory(projectId);
                return ResponseEntity.ok(history);
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Get recent project activity (last 50 entries)
     */
    @GetMapping("/projects/{projectId}/activity")
    public ResponseEntity<?> getRecentProjectActivity(
            @PathVariable Long projectId,
            Authentication authentication) {
        
        try {
            // Get user from authentication
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Get project and verify user has access
            Project project = projectService.getProject(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            
            // Check if user is a member of the project
            var memberOpt = projectMemberRepository.findByProjectAndUser(project, user);
            if (memberOpt.isEmpty()) {
                return ResponseEntity.status(403).body("Permission denied: You are not a member of this project");
            }
            
            // Get recent activity
            List<TaskHistory> recentActivity = taskHistoryService.getRecentProjectActivity(projectId);
            return ResponseEntity.ok(recentActivity);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
