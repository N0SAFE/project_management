package com.example.demo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Project;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.model.User;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.ProjectService;
import com.example.demo.service.ProjectSettingsService;

@RestController
@RequestMapping("/api/projects/{projectId}/settings")
public class ProjectSettingsController {
    
    @Autowired
    private ProjectService projectService;
    
    @Autowired
    private ProjectSettingsService projectSettingsService;
    
    // Task Status endpoints
    @GetMapping("/statuses")
    public ResponseEntity<List<TaskStatus>> getProjectStatuses(@PathVariable Long projectId, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        // Check if user has access to the project
        if (!projectService.isAdmin(project, user) && !projectService.isMember(project, user)) {
            return ResponseEntity.status(403).build();
        }
        
        List<TaskStatus> statuses = projectSettingsService.getProjectStatuses(project);
        return ResponseEntity.ok(statuses);
    }
    
    @PostMapping("/statuses")
    public ResponseEntity<?> createTaskStatus(@PathVariable Long projectId, @RequestBody Map<String, Object> body, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        // Only admins can modify project settings
        if (!projectService.isAdmin(project, user)) {
            return ResponseEntity.status(403).body("Seuls les administrateurs peuvent modifier les paramètres du projet");
        }
        
        try {
            String name = (String) body.get("name");
            String description = (String) body.get("description");
            String color = (String) body.get("color");
            Integer orderIndex = body.get("orderIndex") != null ? (Integer) body.get("orderIndex") : null;
            
            TaskStatus taskStatus = projectSettingsService.createTaskStatus(project, name, description, color, orderIndex);
            return ResponseEntity.ok(taskStatus);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/statuses/{statusId}")
    public ResponseEntity<?> updateTaskStatus(@PathVariable Long projectId, @PathVariable Long statusId, 
                                            @RequestBody Map<String, Object> body, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, user)) {
            return ResponseEntity.status(403).body("Seuls les administrateurs peuvent modifier les paramètres du projet");
        }
        
        try {
            String name = (String) body.get("name");
            String description = (String) body.get("description");
            String color = (String) body.get("color");
            Integer orderIndex = body.get("orderIndex") != null ? (Integer) body.get("orderIndex") : null;
            
            TaskStatus taskStatus = projectSettingsService.updateTaskStatus(statusId, name, description, color, orderIndex);
            return ResponseEntity.ok(taskStatus);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @DeleteMapping("/statuses/{statusId}")
    public ResponseEntity<?> deleteTaskStatus(@PathVariable Long projectId, @PathVariable Long statusId, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, user)) {
            return ResponseEntity.status(403).body("Seuls les administrateurs peuvent modifier les paramètres du projet");
        }
        
        try {
            projectSettingsService.deleteTaskStatus(statusId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/statuses/{statusId}/default")
    public ResponseEntity<?> setDefaultStatus(@PathVariable Long projectId, @PathVariable Long statusId, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, user)) {
            return ResponseEntity.status(403).body("Seuls les administrateurs peuvent modifier les paramètres du projet");
        }
        
        try {
            TaskStatus taskStatus = projectSettingsService.setDefaultStatus(statusId);
            return ResponseEntity.ok(taskStatus);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Task Priority endpoints
    @GetMapping("/priorities")
    public ResponseEntity<List<TaskPriority>> getProjectPriorities(@PathVariable Long projectId, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, user) && !projectService.isMember(project, user)) {
            return ResponseEntity.status(403).build();
        }
        
        List<TaskPriority> priorities = projectSettingsService.getProjectPriorities(project);
        return ResponseEntity.ok(priorities);
    }
    
    @PostMapping("/priorities")
    public ResponseEntity<?> createTaskPriority(@PathVariable Long projectId, @RequestBody Map<String, Object> body, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, user)) {
            return ResponseEntity.status(403).body("Seuls les administrateurs peuvent modifier les paramètres du projet");
        }
        
        try {
            String name = (String) body.get("name");
            String description = (String) body.get("description");
            String color = (String) body.get("color");
            Integer level = body.get("level") != null ? (Integer) body.get("level") : null;
            String todoState = (String) body.get("todoState");
            String doingState = (String) body.get("doingState");
            String finishState = (String) body.get("finishState");
            
            TaskPriority taskPriority = projectSettingsService.createTaskPriority(
                project, name, description, color, level, todoState, doingState, finishState);
            return ResponseEntity.ok(taskPriority);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/priorities/{priorityId}")
    public ResponseEntity<?> updateTaskPriority(@PathVariable Long projectId, @PathVariable Long priorityId, 
                                               @RequestBody Map<String, Object> body, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, user)) {
            return ResponseEntity.status(403).body("Seuls les administrateurs peuvent modifier les paramètres du projet");
        }
        
        try {
            String name = (String) body.get("name");
            String description = (String) body.get("description");
            String color = (String) body.get("color");
            Integer level = body.get("level") != null ? (Integer) body.get("level") : null;
            String todoState = (String) body.get("todoState");
            String doingState = (String) body.get("doingState");
            String finishState = (String) body.get("finishState");
            
            TaskPriority taskPriority = projectSettingsService.updateTaskPriority(
                priorityId, name, description, color, level, todoState, doingState, finishState);
            return ResponseEntity.ok(taskPriority);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @DeleteMapping("/priorities/{priorityId}")
    public ResponseEntity<?> deleteTaskPriority(@PathVariable Long projectId, @PathVariable Long priorityId, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, user)) {
            return ResponseEntity.status(403).body("Seuls les administrateurs peuvent modifier les paramètres du projet");
        }
        
        try {
            projectSettingsService.deleteTaskPriority(priorityId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/priorities/{priorityId}/default")
    public ResponseEntity<?> setDefaultPriority(@PathVariable Long projectId, @PathVariable Long priorityId, Authentication authentication) {
        Project project = projectService.getProject(projectId)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, user)) {
            return ResponseEntity.status(403).body("Seuls les administrateurs peuvent modifier les paramètres du projet");
        }
        
        try {
            TaskPriority taskPriority = projectSettingsService.setDefaultPriority(priorityId);
            return ResponseEntity.ok(taskPriority);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
