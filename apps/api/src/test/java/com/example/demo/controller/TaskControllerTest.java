package com.example.demo.controller;

import com.example.demo.model.Task;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TaskControllerTest {
    @Mock
    private TaskService taskService;
    @Mock
    private UserService userService;
    @Mock
    private Principal principal;
    @InjectMocks
    private TaskController taskController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(principal.getName()).thenReturn("user@example.com");
    }

    @Test
    void createTask_shouldReturnTask() {
        Task task = new Task();
        task.setName("Task 1");
        when(taskService.createTask(any(), any(), any(), any(), any(), any(), any())).thenReturn(task);
        ResponseEntity<?> response = taskController.createTask(Map.of("projectId", 1, "name", "Task 1"), principal);
        assertEquals(200, response.getStatusCodeValue());
    }

    @Test
    void getTask_shouldReturnNotFound() {
        when(taskService.getTask(any())).thenReturn(Optional.empty());
        ResponseEntity<?> response = taskController.getTask(1L);
        assertEquals(404, response.getStatusCodeValue());
    }
}
