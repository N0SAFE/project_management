package com.example.demo.controller;

import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.service.EmailService;
import com.example.demo.service.TaskService;
import com.example.demo.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.extern.slf4j.Slf4j;
import jakarta.mail.MessagingException;

import java.security.Principal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@Slf4j
public class TaskController {

    @Autowired
    private TaskService taskService;
    @Autowired
    private UserService userService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private com.example.demo.service.ProjectService projectService;
    @Autowired
    private com.example.demo.repository.ProjectMemberRepository projectMemberRepository;

    @Value("${spring.application.base-url:http://localhost:4200}")
    private String baseUrl;

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
            
            Task task = taskService.createTask(projectId, name, description, dueDate, priorityId, statusId, assigneeId, user);
            
            // Send email notification if task is assigned to someone
            if (assigneeId != null && !assigneeId.equals(user.getId())) {
                try {
                    User assignee = userService.findById(assigneeId)
                        .orElseThrow(() -> new RuntimeException("Assignee not found"));
                    
                    sendTaskAssignmentEmail(task, assignee, user, project.getName());
                    
                } catch (Exception emailException) {
                    // Log the email error but don't fail the task creation
                    log.error("Failed to send task assignment email for task {}: {}", 
                        task.getId(), emailException.getMessage());
                }
            }
            
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
            Task updated = taskService.updateTask(id, name, description, dueDate, priorityId, statusId, assigneeId, user);
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
            taskService.deleteTask(id, user);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Send task assignment email notification
     */
    private void sendTaskAssignmentEmail(Task task, User assignee, User assigner, String projectName) {
        try {
            String subject = "Nouvelle tâche assignée - " + task.getName();
            
            String taskUrl = baseUrl + "/projects/" + task.getProject().getId() + "/tasks/" + task.getId();
            
            // Format due date if available
            String dueDateText = "";
            if (task.getDueDate() != null) {
                dueDateText = task.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            }
            
            // Create email content
            StringBuilder htmlContent = new StringBuilder();
            htmlContent.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>");
            htmlContent.append("<div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;'>");
            htmlContent.append("<h2 style='color: #333; margin: 0;'>Nouvelle tâche assignée</h2>");
            htmlContent.append("</div>");
            
            htmlContent.append("<div style='padding: 20px; background-color: white; border-radius: 8px; border: 1px solid #e9ecef;'>");
            htmlContent.append("<p>Bonjour ").append(assignee.getUsername()).append(",</p>");
            htmlContent.append("<p>Une nouvelle tâche vous a été assignée par <strong>")
                      .append(assigner.getUsername())
                      .append("</strong> dans le projet <strong>").append(projectName).append("</strong>.</p>");
            
            htmlContent.append("<div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>");
            htmlContent.append("<h3 style='margin: 0 0 10px 0; color: #495057;'>Détails de la tâche :</h3>");
            htmlContent.append("<p style='margin: 5px 0;'><strong>Nom :</strong> ").append(task.getName()).append("</p>");
            
            if (task.getDescription() != null && !task.getDescription().trim().isEmpty()) {
                htmlContent.append("<p style='margin: 5px 0;'><strong>Description :</strong> ").append(task.getDescription()).append("</p>");
            }
            
            if (!dueDateText.isEmpty()) {
                htmlContent.append("<p style='margin: 5px 0;'><strong>Date d'échéance :</strong> ").append(dueDateText).append("</p>");
            }
            
            if (task.getPriority() != null) {
                htmlContent.append("<p style='margin: 5px 0;'><strong>Priorité :</strong> ").append(task.getPriority().getName()).append("</p>");
            }
            htmlContent.append("</div>");
            
            htmlContent.append("<div style='text-align: center; margin: 30px 0;'>");
            htmlContent.append("<a href='").append(taskUrl).append("' ");
            htmlContent.append("style='background-color: #007bff; color: white; padding: 12px 24px; ");
            htmlContent.append("text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'>");
            htmlContent.append("Voir la tâche</a>");
            htmlContent.append("</div>");
            
            htmlContent.append("<p style='color: #6c757d; font-size: 14px; margin-top: 30px;'>");
            htmlContent.append("Vous pouvez accéder à cette tâche et gérer votre travail directement dans l'application de gestion de projet.");
            htmlContent.append("</p>");
            htmlContent.append("</div>");
            
            htmlContent.append("<div style='text-align: center; padding: 20px; color: #6c757d; font-size: 12px;'>");
            htmlContent.append("<p>Cet email a été envoyé automatiquement par le système de gestion de projet.</p>");
            htmlContent.append("</div>");
            htmlContent.append("</div>");
            
            // Send the email
            emailService.sendHtmlEmail(assignee.getEmail(), subject, htmlContent.toString());
            
            log.info("Task assignment email sent successfully to {} for task {}", 
                assignee.getEmail(), task.getId());
                
        } catch (MessagingException e) {
            log.error("Failed to send task assignment email to {} due to messaging error: {}", 
                assignee.getEmail(), e.getMessage());
            // Don't re-throw as this is called from createTask - we don't want to fail task creation
        } catch (Exception e) {
            log.error("Failed to send task assignment email to {} due to unexpected error: {}", 
                assignee.getEmail(), e.getMessage());
            // Don't re-throw as this is called from createTask - we don't want to fail task creation
        }
    }
}
