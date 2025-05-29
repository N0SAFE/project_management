package com.example.demo.service;

import com.example.demo.model.Project;
import com.example.demo.model.Task;
import com.example.demo.model.TaskPriority;
import com.example.demo.model.TaskStatus;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.TaskRepository;
import com.example.demo.repository.TaskPriorityRepository;
import com.example.demo.repository.TaskStatusRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TaskServiceTest {
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private TaskPriorityRepository taskPriorityRepository;
    @Mock
    private TaskStatusRepository taskStatusRepository;
    @InjectMocks
    private TaskService taskService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createTask_shouldCreateTask() {
        // Setup project
        Project project = new Project();
        project.setId(1L);
        
        // Setup task priority
        TaskPriority priority = new TaskPriority();
        priority.setId(1L);
        priority.setName("MEDIUM");
        
        // Setup task status
        TaskStatus status = new TaskStatus();
        status.setId(1L);
        status.setName("TODO");
        
        // Mock repository responses
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(taskPriorityRepository.findById(1L)).thenReturn(Optional.of(priority));
        when(taskStatusRepository.findById(1L)).thenReturn(Optional.of(status));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));
        
        // Execute test
        Task task = taskService.createTask(1L, "Task 1", "desc", null, 1L, 1L, null);
        
        // Assertions
        assertEquals("Task 1", task.getName());
        assertEquals("desc", task.getDescription());
        assertEquals(priority, task.getPriority());
        assertEquals(status, task.getStatus());
        assertEquals(project, task.getProject());
    }

    @Test
    void getTask_shouldReturnTask() {
        Task task = new Task();
        task.setId(1L);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        Optional<Task> found = taskService.getTask(1L);
        assertTrue(found.isPresent());
        assertEquals(1L, found.get().getId());
    }

    @Test
    void createTask_shouldThrowExceptionWhenProjectNotFound() {
        when(projectRepository.findById(1L)).thenReturn(Optional.empty());
        
        Exception exception = assertThrows(RuntimeException.class, () -> 
            taskService.createTask(1L, "Task 1", "desc", null, 1L, 1L, null)
        );
        
        assertNotNull(exception);
    }

    @Test
    void createTask_shouldThrowExceptionWhenPriorityNotFound() {
        Project project = new Project();
        project.setId(1L);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(taskPriorityRepository.findById(1L)).thenReturn(Optional.empty());
        
        Exception exception = assertThrows(RuntimeException.class, () -> 
            taskService.createTask(1L, "Task 1", "desc", null, 1L, 1L, null)
        );
        
        assertNotNull(exception);
    }

    @Test
    void createTask_shouldThrowExceptionWhenStatusNotFound() {
        Project project = new Project();
        project.setId(1L);
        TaskPriority priority = new TaskPriority();
        priority.setId(1L);
        
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(taskPriorityRepository.findById(1L)).thenReturn(Optional.of(priority));
        when(taskStatusRepository.findById(1L)).thenReturn(Optional.empty());
        
        Exception exception = assertThrows(RuntimeException.class, () -> 
            taskService.createTask(1L, "Task 1", "desc", null, 1L, 1L, null)
        );
        
        assertNotNull(exception);
    }
}
