package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectInvitation;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectInvitationRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class InvitationService {
    
    @Autowired
    private ProjectInvitationRepository invitationRepository;
    
    @Autowired
    private ProjectService projectService;
    
    /**
     * Create a new project invitation
     */
    @Transactional
    public ProjectInvitation createInvitation(Project project, String email, 
                                            ProjectMember.ProjectRole role, User inviter) {
        
        // Cancel any existing pending invitations for this project and email
        cancelExistingInvitations(project.getId(), email);
        
        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setProject(project);
        invitation.setEmail(email);
        invitation.setRole(role);
        invitation.setInviter(inviter);
        invitation.setToken(UUID.randomUUID().toString());
        invitation.setCreatedAt(LocalDateTime.now());
        invitation.setExpiresAt(LocalDateTime.now().plusDays(7)); // 7 days expiry
        invitation.setStatus(ProjectInvitation.InvitationStatus.PENDING);
        
        log.info("Creating invitation for {} to project {} with role {}", email, project.getName(), role);
        
        return invitationRepository.save(invitation);
    }
    
    /**
     * Accept an invitation
     */
    @Transactional
    public ProjectMember acceptInvitation(ProjectInvitation invitation, User user) {
        // Mark invitation as accepted
        invitation.setStatus(ProjectInvitation.InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitation.setAcceptedByUser(user);
        invitationRepository.save(invitation);
        
        // Add user to project
        ProjectMember member = projectService.addMember(invitation.getProject(), user, invitation.getRole());
        
        log.info("User {} accepted invitation to project {} with role {}", 
                user.getEmail(), invitation.getProject().getName(), invitation.getRole());
        
        return member;
    }
    
    /**
     * Cancel an invitation
     */
    @Transactional
    public void cancelInvitation(ProjectInvitation invitation) {
        invitation.setStatus(ProjectInvitation.InvitationStatus.CANCELLED);
        invitationRepository.save(invitation);
        
        log.info("Invitation {} cancelled for project {}", 
                invitation.getId(), invitation.getProject().getName());
    }
    
    /**
     * Cancel existing pending invitations for a project and email
     */
    @Transactional
    public void cancelExistingInvitations(Long projectId, String email) {
        Optional<ProjectInvitation> existingInvitation = invitationRepository
                .findActiveInvitation(projectId, email, LocalDateTime.now());
        
        if (existingInvitation.isPresent()) {
            cancelInvitation(existingInvitation.get());
            log.info("Cancelled existing invitation for {} to project {}", email, projectId);
        }
    }
    
    /**
     * Check if there's an active invitation
     */
    public boolean hasActiveInvitation(Long projectId, String email) {
        return invitationRepository.findActiveInvitation(projectId, email, LocalDateTime.now()).isPresent();
    }
    
    /**
     * Find invitation by token
     */
    public Optional<ProjectInvitation> findByToken(String token) {
        return invitationRepository.findByToken(token);
    }
    
    /**
     * Find invitation by ID
     */
    public Optional<ProjectInvitation> findById(Long id) {
        return invitationRepository.findById(id);
    }
    
    /**
     * Get all invitations for a project
     */
    public List<ProjectInvitation> getProjectInvitations(Long projectId) {
        return invitationRepository.findByProjectId(projectId);
    }
    
    /**
     * Get active invitations for an email
     */
    public List<ProjectInvitation> getActiveInvitationsForEmail(String email) {
        return invitationRepository.findActiveInvitationsByEmail(email, LocalDateTime.now());
    }
    
    /**
     * Cleanup expired invitations
     */
    @Transactional
    public int cleanupExpiredInvitations() {
        int count = invitationRepository.expireOldInvitations(LocalDateTime.now());
        if (count > 0) {
            log.info("Expired {} old invitations", count);
        }
        return count;
    }
}
