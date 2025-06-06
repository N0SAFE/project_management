package com.example.demo.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskHistoryRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class ProjectService {
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private ProjectMemberRepository projectMemberRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProjectSettingsService projectSettingsService;
    @Autowired
    private TaskHistoryRepository taskHistoryRepository;
    @Autowired
    private TaskRepository taskRepository;

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public List<Project> getProjectsByUser(User user) {
        List<ProjectMember> projectMembers = projectMemberRepository.findByUser(user);
        return projectMembers.stream()
            .map(ProjectMember::getProject)
            .collect(Collectors.toList());
    }

    @Transactional
    public Project createProject(String name, String description, LocalDate startDate, User creator) {
        if (projectRepository.existsByName(name)) {
            throw new IllegalArgumentException("Project name already exists");
        }
        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setStartDate(startDate);
        project = projectRepository.save(project);
        
        // Add creator as admin member
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(creator);
        member.setRole(ProjectMember.ProjectRole.ADMIN);
        projectMemberRepository.save(member);
        
        // Initialize default project settings
        projectSettingsService.initializeDefaultProjectSettings(project);
        
        return project;
    }

    public Optional<Project> getProject(Long id) {
        return projectRepository.findById(id);
    }

    public List<ProjectMember> getProjectMembers(Project project) {
        return projectMemberRepository.findByProject(project);
    }

    public ProjectMember inviteMember(Project project, String email, ProjectMember.ProjectRole role) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (projectMemberRepository.findByProjectAndUser(project, user).isPresent()) {
            throw new IllegalArgumentException("User already a member");
        }
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setRole(role);
        return projectMemberRepository.save(member);
    }

    public ProjectMember changeMemberRole(Project project, User user, ProjectMember.ProjectRole newRole) {
        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, user)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        member.setRole(newRole);
        return projectMemberRepository.save(member);
    }

    public boolean isAdmin(Project project, User user) {
        return projectMemberRepository.findByProjectAndUser(project, user)
                .map(m -> m.getRole() == ProjectMember.ProjectRole.ADMIN)
                .orElse(false);
    }

    public boolean isMember(Project project, User user) {
        return projectMemberRepository.findByProjectAndUser(project, user)
                .isPresent();
    }

    /**
     * Check if a user with given email is already a member of the project
     */
    public boolean isMember(Project project, String email) {
        Optional<User> user = userRepository.findByEmail(email);
        return user.isPresent() && isMember(project, user.get());
    }

    /**
     * Add a member to project (used by invitation acceptance)
     */
    @Transactional
    public ProjectMember addMember(Project project, User user, ProjectMember.ProjectRole role) {
        // Check if user is already a member
        Optional<ProjectMember> existingMember = projectMemberRepository.findByProjectAndUser(project, user);
        if (existingMember.isPresent()) {
            throw new IllegalArgumentException("User is already a member of this project");
        }

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setRole(role);
        return projectMemberRepository.save(member);
    }

    /**
     * Remove a member from the project
     */
    @Transactional
    public void removeMember(Project project, User user) {
        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, user)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this project"));
        
        projectMemberRepository.delete(member);
    }

    /**
     * Check if a project with the given name exists
     */
    public boolean existsByName(String name) {
        return projectRepository.existsByName(name);
    }

    /**
     * Update an existing project
     */
    @Transactional
    public Project updateProject(Project project) {
        return projectRepository.save(project);
    }

    /**
     * Delete a project and all its associated data
     * This includes: ProjectMembers, Tasks, TaskHistories, TaskStatus, TaskPriority
     */
    @Transactional
    public void deleteProject(Long projectId) {
        try {
            // Verify the project exists before deletion
            if (!projectRepository.existsById(projectId)) {
                throw new RuntimeException("Project with ID " + projectId + " does not exist");
            }
            
            System.out.println("Starting deletion of project ID: " + projectId);
            
            // Step 1: Delete task histories first to avoid foreign key constraint violations
            System.out.println("Deleting task histories for project: " + projectId);
            taskHistoryRepository.deleteByProjectId(projectId);
            
            // Step 2: Clear task assignees to break Task -> User relationships
            System.out.println("Clearing task assignees");
            taskRepository.clearAssigneesByProjectId(projectId);
            
            // Step 2.1: Delete tasks associated with the project
            // This is optional, as clearing assignees should suffice for most cases
            System.out.println("Deleting tasks for project: " + projectId);
            taskRepository.deleteByProjectId(projectId);
            
            // Step 2.2: Delete project members
            System.out.println("Deleting project members for project: " + projectId);
            projectMemberRepository.deleteByProjectId(projectId);
            
            // Step 2.3: Delete project settings if applicable
            // Assuming there's a method to delete project settings
            System.out.println("Deleting project settings for project: " + projectId);
            projectSettingsService.deleteByProjectId(projectId);
            
            // Step 3: Use native SQL deletion to avoid Hibernate cascade issues
            // This bypasses Hibernate's entity loading and cascade management
            System.out.println("Deleting project entity with ID: " + projectId);
            projectRepository.deleteProjectById(projectId);
            
            System.out.println("Successfully deleted project ID: " + projectId);
        } catch (Exception e) {
            System.err.println("Error deleting project with ID: " + projectId + " - " + e.getMessage());
            throw new RuntimeException("Failed to delete project: " + e.getMessage(), e);
        }
    }
}
