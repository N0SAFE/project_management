package com.example.demo.controller;

import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.service.TaskService;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;
    @Autowired
    private UserService userService;
    @Autowired
    private com.example.demo.service.ProjectService projectService;
    @Autowired
    private com.example.demo.repository.ProjectMemberRepository projectMemberRepository;

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Map<String, Object> body, Principal principal) {
        try {
            Long projectId = Long.valueOf(body.get("projectId").toString());
            String name = (String) body.get("name");
            String description = (String) body.get("description");
            String dueDate = (String) body.get("dueDate");
            Long priorityId = body.get("priorityId") != null ? Long.valueOf(body.get("priorityId").toString()) : null;
            Long statusId = body.get("statusId") != null ? Long.valueOf(body.get("statusId").toString()) : null;
            Long assigneeId = body.get("assigneeId") != null ? Long.valueOf(body.get("assigneeId").toString()) : null;
            User user = userService.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
            var project = projectService.getProject(projectId).orElseThrow(() -> new RuntimeException("Project not found"));
            var memberOpt = projectMemberRepository.findByProjectAndUser(project, user);
            if (memberOpt.isEmpty() || memberOpt.get().getRole() == com.example.demo.model.ProjectMember.ProjectRole.OBSERVER) {
                return ResponseEntity.status(403).body("Permission denied: Only project members or admins can create tasks");
            }
            Task task = taskService.createTask(projectId, name, description, dueDate, priorityId, statusId, assigneeId);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTask(@PathVariable Long id) {
        try {
            return taskService.getTask(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Task>> getTasksByProject(@PathVariable Long projectId) {
        try {
            return ResponseEntity.ok(taskService.getTasksByProject(projectId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Map<String, Object> body, Principal principal) {
        try {
            String name = (String) body.get("name");
            String description = (String) body.get("description");
            String dueDate = (String) body.get("dueDate");
            Long priorityId = body.get("priorityId") != null ? Long.valueOf(body.get("priorityId").toString()) : null;
            Long statusId = body.get("statusId") != null ? Long.valueOf(body.get("statusId").toString()) : null;
            Long assigneeId = body.get("assigneeId") != null ? Long.valueOf(body.get("assigneeId").toString()) : null;
            User user = userService.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
            Task task = taskService.getTask(id).orElseThrow(() -> new RuntimeException("Task not found"));
            var project = task.getProject();
            var memberOpt = projectMemberRepository.findByProjectAndUser(project, user);
            if (memberOpt.isEmpty() || memberOpt.get().getRole() == com.example.demo.model.ProjectMember.ProjectRole.OBSERVER) {
                return ResponseEntity.status(403).body("Permission denied: Only project members or admins can update tasks");
            }
            Task updated = taskService.updateTask(id, name, description, dueDate, priorityId, statusId, assigneeId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, Principal principal) {
        try {
            User user = userService.findByEmail(principal.getName()).orElseThrow(() -> new RuntimeException("User not found"));
            Task task = taskService.getTask(id).orElseThrow(() -> new RuntimeException("Task not found"));
            var project = task.getProject();
            var memberOpt = projectMemberRepository.findByProjectAndUser(project, user);
            if (memberOpt.isEmpty() || memberOpt.get().getRole() != com.example.demo.model.ProjectMember.ProjectRole.ADMIN) {
                return ResponseEntity.status(403).body("Permission denied: Only project admins can delete tasks");
            }
            taskService.deleteTask(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
