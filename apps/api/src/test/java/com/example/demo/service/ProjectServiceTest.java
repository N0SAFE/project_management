package com.example.demo.service;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskHistoryRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.UserRepository;

class ProjectServiceTest {
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectSettingsService projectSettingsService;
    @Mock
    private TaskHistoryRepository taskHistoryRepository;
    @Mock
    private TaskRepository taskRepository;
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
    
    @Test
    void deleteProject_shouldDeleteTaskHistoriesAndProject() {
        // Mock existsById to return true (project exists)
        when(projectRepository.existsById(1L)).thenReturn(true);
        
        // Mock the deletion operations
        doNothing().when(taskHistoryRepository).deleteByProjectId(1L);
        doNothing().when(taskRepository).clearAssigneesByProjectId(1L);
        doNothing().when(taskRepository).deleteByProjectId(1L);
        doNothing().when(projectMemberRepository).deleteByProjectId(1L);
        doNothing().when(projectSettingsService).deleteByProjectId(1L);
        doNothing().when(projectRepository).deleteProjectById(1L);
        
        // Execute the deletion with project ID
        projectService.deleteProject(1L);
        
        // Verify that we check if the project exists first
        verify(projectRepository, times(1)).existsById(1L);
        
        // Verify that task histories are deleted first
        verify(taskHistoryRepository, times(1)).deleteByProjectId(1L);
        
        // Verify that task assignees are cleared
        verify(taskRepository, times(1)).clearAssigneesByProjectId(1L);
        
        // Verify that tasks are deleted
        verify(taskRepository, times(1)).deleteByProjectId(1L);
        
        // Verify that project members are deleted
        verify(projectMemberRepository, times(1)).deleteByProjectId(1L);
        
        // Verify that project settings are deleted
        verify(projectSettingsService, times(1)).deleteByProjectId(1L);
        
        // Verify that the project itself is deleted with native query
        verify(projectRepository, times(1)).deleteProjectById(1L);
    }
    
    @Test
    void deleteProject_shouldThrowExceptionIfProjectNotExists() {
        // Mock existsById to return false (project doesn't exist)
        when(projectRepository.existsById(1L)).thenReturn(false);
        
        // Execute the deletion and expect an exception
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            projectService.deleteProject(1L);
        });
        
        // Verify the exception message
        assertTrue(exception.getMessage().contains("Failed to delete project"));
        assertTrue(exception.getCause().getMessage().contains("Project with ID 1 does not exist"));
        
        // Verify that existsById is called
        verify(projectRepository, times(1)).existsById(1L);
        
        // Verify that other repository methods are never called since project doesn't exist
        verify(taskHistoryRepository, never()).deleteByProjectId(1L);
        verify(taskRepository, never()).clearAssigneesByProjectId(1L);
        verify(taskRepository, never()).deleteByProjectId(1L);
        verify(projectMemberRepository, never()).deleteByProjectId(1L);
        verify(projectRepository, never()).deleteProjectById(1L);
    }
}
