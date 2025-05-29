package com.example.demo.service;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
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
}
