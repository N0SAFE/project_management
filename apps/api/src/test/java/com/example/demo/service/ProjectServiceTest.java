package com.example.demo.service;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProjectServiceTest {
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createProject_shouldCreateProjectAndAdminMember() {
        User creator = new User();
        creator.setId(1L);
        when(projectRepository.existsByName(any())).thenReturn(false);
        when(projectRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(projectMemberRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Project project = projectService.createProject("Test Project", "desc", LocalDate.now(), creator);
        assertEquals("Test Project", project.getName());
        verify(projectMemberRepository, times(1)).save(any(ProjectMember.class));
    }

    @Test
    void createProject_shouldThrowIfNameExists() {
        when(projectRepository.existsByName(any())).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () ->
                projectService.createProject("Test Project", "desc", LocalDate.now(), new User()));
    }

    @Test
    void isAdmin_shouldReturnTrueIfAdmin() {
        Project project = new Project();
        User user = new User();
        ProjectMember member = new ProjectMember();
        member.setRole(ProjectMember.ProjectRole.ADMIN);
        when(projectMemberRepository.findByProjectAndUser(project, user)).thenReturn(Optional.of(member));
        assertTrue(projectService.isAdmin(project, user));
    }

    @Test
    void isAdmin_shouldReturnFalseIfNotAdmin() {
        Project project = new Project();
        User user = new User();
        ProjectMember member = new ProjectMember();
        member.setRole(ProjectMember.ProjectRole.MEMBER);
        when(projectMemberRepository.findByProjectAndUser(project, user)).thenReturn(Optional.of(member));
        assertFalse(projectService.isAdmin(project, user));
    }
}
