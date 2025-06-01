package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectInvitation;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectInvitationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectInvitationService {

    private final ProjectInvitationRepository invitationRepository;
    private final ProjectService projectService;
    private final UserService userService;
    private final EmailService emailService;

    @Value("${spring.application.base-url:http://localhost:4200}")
    private String baseUrl;

    /**
     * Create and send a project invitation
     */
    @Transactional
    public ProjectInvitation createInvitation(Project project, String email,
            ProjectMember.ProjectRole role, User inviter) {

        // Check if there's already a pending invitation for this email and project
        Optional<ProjectInvitation> existingInvitation = invitationRepository
                .findActiveInvitation(project.getId(), email, LocalDateTime.now());

        if (existingInvitation.isPresent()) {
            throw new IllegalStateException("Une invitation active existe déjà pour cet email");
        }

        // Check if user is already a member of the project
        Optional<User> existingUser = userService.findByEmail(email);
        if (existingUser.isPresent() && projectService.isMember(project, existingUser.get())) {
            throw new IllegalStateException("Cet utilisateur est déjà membre du projet");
        }

        // Generate unique token
        String token = UUID.randomUUID().toString();

        // Create invitation
        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setProject(project);
        invitation.setInviter(inviter);
        invitation.setEmail(email);
        invitation.setRole(role);
        invitation.setToken(token);
        invitation.setCreatedAt(LocalDateTime.now());
        invitation.setExpiresAt(LocalDateTime.now().plusDays(7)); // 7 days expiration
        invitation.setStatus(ProjectInvitation.InvitationStatus.PENDING);

        invitation = invitationRepository.save(invitation);

        // Send email
        sendInvitationEmail(invitation);

        log.info("Created invitation for email {} to project {} with role {}",
                email, project.getName(), role);

        return invitation;
    }

    /**
     * Send invitation email
     */
    private void sendInvitationEmail(ProjectInvitation invitation) {
        try {
            boolean userExists = userService.findByEmail(invitation.getEmail()).isPresent();
            String roleDisplay = mapRoleToFrench(invitation.getRole());

            emailService.sendProjectInvitationSmart(
                    invitation.getEmail(),
                    invitation.getInviter().getUsername(),
                    invitation.getProject().getName(),
                    invitation.getProject().getDescription(),
                    roleDisplay,
                    invitation.getToken(),
                    userExists,
                    baseUrl
            );

            log.info("Invitation email sent to {} for project {}",
                    invitation.getEmail(), invitation.getProject().getName());

        } catch (Exception e) {
            log.error("Failed to send invitation email to {} for project {}: {}",
                    invitation.getEmail(), invitation.getProject().getName(), e.getMessage());
            // Don't fail the invitation creation if email fails
        }
    }

    /**
     * Accept an invitation
     */
    @Transactional
    public ProjectMember acceptInvitation(String token, User user) {
        ProjectInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invitation non trouvée"));

        if (!invitation.isPending()) {
            throw new IllegalStateException("Cette invitation n'est plus valide");
        }

        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("Cette invitation n'est pas destinée à cet utilisateur");
        }

        // Check if user is already a member
        if (projectService.isMember(invitation.getProject(), user)) {
            throw new IllegalStateException("Vous êtes déjà membre de ce projet");
        }

        // Create project member
        ProjectMember member = projectService.addMember(invitation.getProject(), user, invitation.getRole());

        // Mark invitation as accepted
        invitation.setStatus(ProjectInvitation.InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitation.setAcceptedByUser(user);
        invitationRepository.save(invitation);

        log.info("User {} accepted invitation to project {} with role {}",
                user.getEmail(), invitation.getProject().getName(), invitation.getRole());

        return member;
    }

    /**
     * Get invitation by token
     */
    public Optional<ProjectInvitation> getInvitationByToken(String token) {
        return invitationRepository.findByToken(token);
    }

    /**
     * Get all invitations for a project
     */
    public List<ProjectInvitation> getProjectInvitations(Long projectId) {
        return invitationRepository.findByProjectId(projectId);
    }

    /**
     * Cancel an invitation
     */
    @Transactional
    public void cancelInvitation(String token, User canceller) {
        ProjectInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invitation non trouvée"));

        // Check if user has permission to cancel
        if (!projectService.isAdmin(invitation.getProject(), canceller)) {
            throw new IllegalArgumentException("Seuls les administrateurs peuvent annuler les invitations");
        }

        invitation.setStatus(ProjectInvitation.InvitationStatus.CANCELLED);
        invitationRepository.save(invitation);

        log.info("Invitation {} cancelled by {}", token, canceller.getEmail());
    }

    /**
     * Clean up expired invitations
     */
    @Transactional
    public int cleanupExpiredInvitations() {
        return invitationRepository.expireOldInvitations(LocalDateTime.now());
    }

    /**
     * Map ProjectRole enum to French display text
     */
    private String mapRoleToFrench(ProjectMember.ProjectRole role) {
        switch (role) {
            case ADMIN:
                return "Administrateur";
            case MEMBER:
                return "Membre";
            case OBSERVER:
                return "Observateur";
            default:
                return role.toString();
        }
    }
}
