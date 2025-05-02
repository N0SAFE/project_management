package com.example.demo.controller;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.service.ProjectService;
import com.example.demo.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.time.LocalDate;
import java.util.Optional;


import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import java.util.Map;

class ProjectControllerTest {
    @Mock
    private ProjectService projectService;
    @Mock
    private UserService userService;
    @Mock
    private Principal principal;
    @InjectMocks
    private ProjectController projectController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(principal.getName()).thenReturn("user@example.com");
    }

    @Test
    void createProject_shouldReturnProject() {
        User user = new User();
        when(userService.findByEmail(any())).thenReturn(Optional.of(user));
        Project project = new Project();
        project.setName("Test");
        when(projectService.createProject(any(), any(), any(), any())).thenReturn(project);
        ResponseEntity<?> response = projectController.createProject(Map.of("name", "Test", "description", "desc", "startDate", LocalDate.now().toString()), principal);
        assertEquals(200, response.getStatusCodeValue());
    }

    @Test
    void getProject_shouldReturnNotFound() {
        when(projectService.getProject(any())).thenReturn(Optional.empty());
        ResponseEntity<?> response = projectController.getProject(1L);
        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void inviteMember_shouldReturnForbiddenIfNotAdmin() {
        Project project = new Project();
        User user = new User();
        when(projectService.getProject(any())).thenReturn(Optional.of(project));
        when(userService.findByEmail(any())).thenReturn(Optional.of(user));
        when(projectService.isAdmin(any(), any())).thenReturn(false);
        ResponseEntity<?> response = projectController.inviteMember(1L, Map.of("email", "test@test.com", "role", "MEMBER"), principal);
        assertEquals(403, response.getStatusCodeValue());
    }
}
