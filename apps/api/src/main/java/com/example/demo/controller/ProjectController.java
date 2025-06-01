package com.example.demo.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import com.example.demo.model.ProjectInvitation;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.EmailService;
import com.example.demo.service.InvitationService;
import com.example.demo.service.ProjectService;
import com.example.demo.service.UserService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/projects")
@Slf4j
public class ProjectController {
    @Autowired
    private ProjectService projectService;
    @Autowired
    private UserService userService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private InvitationService invitationService;

    @Value("${spring.application.base-url:http://localhost:4200}")
    private String baseUrl;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Map<String, String> body, Authentication authentication) {
        String name = body.get("name");
        String description = body.get("description");
        LocalDate startDate = LocalDate.parse(body.get("startDate"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User creator = userPrincipal.getUser();
        
        Project project = projectService.createProject(name, description, startDate, creator);
        return ResponseEntity.ok(project);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id) {
        return projectService.getProject(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ProjectMember>> getProjectMembers(@PathVariable Long id) {
        Project project = projectService.getProject(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return ResponseEntity.ok(projectService.getProjectMembers(project));
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteMember(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        try {
            Project project = projectService.getProject(id)
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User admin = userPrincipal.getUser();
            
            if (!projectService.isAdmin(project, admin)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can invite members"));
            }
            
            String email = body.get("email");
            ProjectMember.ProjectRole role = ProjectMember.ProjectRole.valueOf(body.get("role"));
            
            // Check if already invited or member
            if (invitationService.hasActiveInvitation(project.getId(), email)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cet utilisateur a déjà une invitation active"));
            }
            
            if (projectService.isMember(project, email)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cet utilisateur est déjà membre du projet"));
            }
            
            // Create invitation with token
            ProjectInvitation invitation = invitationService.createInvitation(
                project, email, role, admin
            );
            
            // Check if user exists
            boolean userExists = userService.findByEmail(email).isPresent();
            
            // Send appropriate email
            try {
                emailService.sendProjectInvitationSmart(
                    email, 
                    admin.getUsername(),
                    project.getName(),
                    project.getDescription(),
                    mapRoleToFrench(role),
                    invitation.getToken(),
                    userExists,
                    baseUrl
                );
                
                log.info("Invitation email sent successfully to {} for project {}", email, project.getName());
                
                return ResponseEntity.ok(Map.of(
                    "invitation", Map.of(
                        "id", invitation.getId(),
                        "email", invitation.getEmail(),
                        "role", invitation.getRole(),
                        "status", invitation.getStatus(),
                        "expiresAt", invitation.getExpiresAt()
                    ),
                    "userExists", userExists,
                    "message", "Invitation envoyée avec succès"
                ));
                
            } catch (Exception emailException) {
                log.error("Failed to send invitation email to {} for project {}: {}", 
                    email, project.getName(), emailException.getMessage());
                
                return ResponseEntity.ok(Map.of(
                    "invitation", Map.of(
                        "id", invitation.getId(),
                        "email", invitation.getEmail(),
                        "role", invitation.getRole(),
                        "status", invitation.getStatus()
                    ),
                    "warning", "Invitation créée mais l'email de notification n'a pas pu être envoyé"
                ));
            }
            
        } catch (Exception e) {
            log.error("Failed to create invitation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Échec de la création de l'invitation: " + e.getMessage()));
        }
    }
    
    /**
     * Map ProjectRole enum to French display text
     */
    private String mapRoleToFrench(ProjectMember.ProjectRole role) {
        return switch (role) {
            case ADMIN -> "Administrateur";
            case MEMBER -> "Membre";
            case OBSERVER -> "Observateur";
            default -> role.toString();
        };
    }

    @PostMapping("/{id}/members/{userId}/role")
    public ResponseEntity<?> changeMemberRole(@PathVariable Long id, @PathVariable Long userId, @RequestBody Map<String, String> body, Authentication authentication) {
        Project project = projectService.getProject(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User admin = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, admin)) {
            return ResponseEntity.status(403).body("Only admins can change roles");
        }
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ProjectMember.ProjectRole newRole = ProjectMember.ProjectRole.valueOf(body.get("role"));
        ProjectMember member = projectService.changeMemberRole(project, user, newRole);
        return ResponseEntity.ok(member);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        try {
            Project project = projectService.getProject(id)
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Check if user is admin of the project
            if (!projectService.isAdmin(project, user)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can update projects"));
            }
            
            // Update project fields
            String name = body.get("name");
            String description = body.get("description");
            
            if (name != null && !name.trim().isEmpty()) {
                // Check if name is already taken by another project
                if (!name.equals(project.getName()) && projectService.existsByName(name)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Project name already exists"));
                }
                project.setName(name);
            }
            
            if (description != null) {
                project.setDescription(description);
            }
            
            Project updatedProject = projectService.updateProject(project);
            return ResponseEntity.ok(updatedProject);
            
        } catch (Exception e) {
            log.error("Failed to update project: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to update project: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        try {
            Project project = projectService.getProject(id)
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Check if user is admin of the project
            if (!projectService.isAdmin(project, user)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can delete projects"));
            }
            
            // Verify project name for confirmation
            String confirmationName = body.get("confirmationName");
            if (confirmationName == null || !confirmationName.equals(project.getName())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Project name confirmation does not match"));
            }
            
            // Pass only the project ID to avoid detached entity issues
            projectService.deleteProject(id);
            return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
            
        } catch (Exception e) {
            log.error("Failed to delete project: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to delete project: " + e.getMessage()));
        }
    }
}
