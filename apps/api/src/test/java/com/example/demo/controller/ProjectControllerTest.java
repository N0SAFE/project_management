package com.example.demo.controller;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.example.demo.model.Project;
import com.example.demo.model.User;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.ProjectService;
import com.example.demo.service.UserService;

class ProjectControllerTest {
    @Mock
    private ProjectService projectService;
    @Mock
    private UserService userService;
    @Mock
    private Authentication authentication;
    @Mock
    private UserPrincipal userPrincipal;
    @InjectMocks
    private ProjectController projectController;

    private static final String TEST_USER_EMAIL = "user@example.com";
    private User testUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Setup test user
        testUser = new User();
        testUser.setEmail(TEST_USER_EMAIL);
        testUser.setId(1L);
        
        // Setup authentication mock
        when(authentication.getPrincipal()).thenReturn(userPrincipal);
        when(userPrincipal.getUser()).thenReturn(testUser);
    }

    @Test
    void createProject_shouldReturnProject() {
        Project project = new Project();
        project.setName("Test");
        when(projectService.createProject(any(), any(), any(), any())).thenReturn(project);
        ResponseEntity<?> response = projectController.createProject(Map.of("name", "Test", "description", "desc", "startDate", LocalDate.now().toString()), authentication);
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
        when(projectService.getProject(any())).thenReturn(Optional.of(project));
        when(projectService.isAdmin(any(), any())).thenReturn(false);
        ResponseEntity<?> response = projectController.inviteMember(1L, Map.of("email", "test@test.com", "role", "MEMBER"), authentication);
        assertEquals(403, response.getStatusCodeValue());
    }
}
