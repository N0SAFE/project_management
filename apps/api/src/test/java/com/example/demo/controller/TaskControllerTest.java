package com.example.demo.controller;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.Task;
import com.example.demo.model.User;
import com.example.demo.repository.ProjectMemberRepository;
import com.example.demo.service.ProjectService;
import com.example.demo.service.TaskService;
import com.example.demo.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TaskControllerTest {
    @Mock
    private TaskService taskService;
    @Mock
    private UserService userService;
    @Mock
    private ProjectService projectService;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private Principal principal;
    @InjectMocks
    private TaskController taskController;

    private User mockUser;
    private Project mockProject;
    private ProjectMember mockProjectMember;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(principal.getName()).thenReturn("user@example.com");
        
        // Create a mock user
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmail("user@example.com");
        mockUser.setUsername("Test User");
        
        // Create a mock project
        mockProject = new Project();
        mockProject.setId(1L);
        mockProject.setName("Test Project");
        
        // Create a mock project member with ADMIN role
        mockProjectMember = new ProjectMember();
        mockProjectMember.setId(1L);
        mockProjectMember.setProject(mockProject);
        mockProjectMember.setUser(mockUser);
        mockProjectMember.setRole(ProjectMember.ProjectRole.ADMIN);
        
        // Mock userService to return the mock user
        when(userService.findByEmail("user@example.com")).thenReturn(Optional.of(mockUser));
        
        // Mock projectService to return the mock project
        when(projectService.getProject(1L)).thenReturn(Optional.of(mockProject));
        
        // Mock projectMemberRepository to return the mock project member
        when(projectMemberRepository.findByProjectAndUser(mockProject, mockUser))
                .thenReturn(Optional.of(mockProjectMember));
    }

    @Test
    void createTask_shouldReturnTask() {
        Task task = new Task();
        task.setName("Task 1");
        
        // Mock the createTask method with the correct parameter types
        when(taskService.createTask(
            anyLong(),     // projectId
            anyString(),   // name
            anyString(),   // description
            anyString(),   // dueDate
            anyLong(),     // priorityId
            anyLong(),     // statusId
            anyLong(),     // assigneeId
            any(User.class) // createdBy
        )).thenReturn(task);
        
        Map<String, Object> requestBody = Map.of(
            "projectId", 1L,
            "name", "Task 1",
            "description", "Test description"
        );
        
        ResponseEntity<?> response = taskController.createTask(requestBody, principal);
        assertEquals(200, response.getStatusCodeValue());
    }

    @Test
    void getTask_shouldReturnNotFound() {
        when(taskService.getTask(any())).thenReturn(Optional.empty());
        ResponseEntity<?> response = taskController.getTask(1L);
        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void updateTask_shouldReturnUpdatedTask() {
        Task task = new Task();
        task.setId(1L);
        task.setName("Updated Task");
        task.setProject(mockProject); // Set the project for the task
        
        // Mock getTask to return the task
        when(taskService.getTask(1L)).thenReturn(Optional.of(task));
        
        // Mock the updateTask method with the correct parameter types
        when(taskService.updateTask(
            anyLong(),     // taskId
            anyString(),   // name
            anyString(),   // description
            anyString(),   // dueDate
            anyLong(),     // priorityId
            anyLong(),     // statusId
            anyLong(),     // assigneeId
            any(User.class) // modifiedBy
        )).thenReturn(task);
        
        Map<String, Object> requestBody = Map.of(
            "name", "Updated Task",
            "description", "Updated description"
        );
        
        ResponseEntity<?> response = taskController.updateTask(1L, requestBody, principal);
        assertEquals(200, response.getStatusCodeValue());
    }
}
