package com.example.demo.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
@RequestMapping("/api/invitations")
@Slf4j
public class InvitationController {

    @Autowired
    private InvitationService invitationService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Value("${spring.application.base-url:http://localhost:4200}")
    private String baseUrl;

    /**
     * Send project invitation
     */
    @PostMapping("/project/{projectId}")
    public ResponseEntity<?> inviteToProject(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        try {
            Project project = projectService.getProject(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found"));

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User inviter = userPrincipal.getUser();

            // Check if user is admin
            if (!projectService.isAdmin(project, inviter)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can invite members"));
            }

            String email = body.get("email");
            ProjectMember.ProjectRole role = ProjectMember.ProjectRole.valueOf(body.get("role"));

            // Check if already invited or member
            if (invitationService.hasActiveInvitation(project.getId(), email)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "User already has an active invitation"));
            }

            if (projectService.isMember(project, email)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "User is already a member of this project"));
            }

            // Create invitation with token
            ProjectInvitation invitation = invitationService.createInvitation(
                    project, email, role, inviter
            );

            // Check if user exists
            boolean userExists = userService.existsByEmail(email);

            // Send appropriate email
            try {
                emailService.sendProjectInvitationSmart(
                        email,
                        inviter.getUsername(),
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
                        "message", "Invitation sent successfully"
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
                        "warning", "Invitation created but email notification failed to send"
                ));
            }

        } catch (Exception e) {
            log.error("Failed to create invitation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to create invitation: " + e.getMessage()));
        }
    }

    /**
     * Accept invitation
     */
    @PostMapping("/accept/{token}")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable String token,
            Authentication authentication) {

        try {
            ProjectInvitation invitation = invitationService.findByToken(token)
                    .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

            if (invitation.isExpired()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invitation has expired"));
            }

            if (!invitation.getStatus().equals(ProjectInvitation.InvitationStatus.PENDING)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invitation is no longer valid"));
            }

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();

            // Verify that the authenticated user matches the invitation email
            if (!user.getEmail().equals(invitation.getEmail())) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "You can only accept invitations sent to your email"));
            }

            // Accept the invitation
            ProjectMember member = invitationService.acceptInvitation(invitation, user);

            return ResponseEntity.ok(Map.of(
                    "member", member,
                    "project", invitation.getProject(),
                    "message", "Invitation accepted successfully"
            ));

        } catch (Exception e) {
            log.error("Failed to accept invitation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to accept invitation: " + e.getMessage()));
        }
    }

    /**
     * Get invitation details (for preview before login)
     */
    @GetMapping("/details/{token}")
    public ResponseEntity<?> getInvitationDetails(@PathVariable String token) {
        try {
            ProjectInvitation invitation = invitationService.findByToken(token)
                    .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

            if (invitation.isExpired()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invitation has expired"));
            }

            if (!invitation.getStatus().equals(ProjectInvitation.InvitationStatus.PENDING)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invitation is no longer valid"));
            }

            return ResponseEntity.ok(Map.of(
                    "project", Map.of(
                            "id", invitation.getProject().getId(),
                            "name", invitation.getProject().getName(),
                            "description", invitation.getProject().getDescription()
                    ),
                    "role", mapRoleToFrench(invitation.getRole()),
                    "inviterName", invitation.getInviter().getUsername(),
                    "email", invitation.getEmail(),
                    "expiresAt", invitation.getExpiresAt()
            ));

        } catch (Exception e) {
            log.error("Failed to get invitation details: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid invitation"));
        }
    }

    /**
     * Get project invitations (admin only)
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getProjectInvitations(
            @PathVariable Long projectId,
            Authentication authentication) {

        try {
            Project project = projectService.getProject(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found"));

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();

            if (!projectService.isAdmin(project, user)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Only admins can view invitations"));
            }

            return ResponseEntity.ok(invitationService.getProjectInvitations(projectId));

        } catch (Exception e) {
            log.error("Failed to get project invitations: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get invitations"));
        }
    }

    /**
     * Cancel invitation (admin only)
     */
    @PostMapping("/cancel/{invitationId}")
    public ResponseEntity<?> cancelInvitation(
            @PathVariable Long invitationId,
            Authentication authentication) {

        try {
            ProjectInvitation invitation = invitationService.findById(invitationId)
                    .orElseThrow(() -> new RuntimeException("Invitation not found"));

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();

            if (!projectService.isAdmin(invitation.getProject(), user)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Only admins can cancel invitations"));
            }

            invitationService.cancelInvitation(invitation);

            return ResponseEntity.ok(Map.of("message", "Invitation cancelled successfully"));

        } catch (Exception e) {
            log.error("Failed to cancel invitation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to cancel invitation"));
        }
    }

    /**
     * Map ProjectRole enum to French display text
     */
    private String mapRoleToFrench(ProjectMember.ProjectRole role) {
        return switch (role) {
            case ADMIN ->
                "Administrateur";
            case MEMBER ->
                "Membre";
            case OBSERVER ->
                "Observateur";
        };
    }
}
