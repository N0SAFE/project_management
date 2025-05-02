package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTest {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void registerUser_shouldHashPasswordAndSave() {
        User user = new User();
        user.setPassword("password");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        User saved = userService.registerUser(user);
        assertNotEquals("password", saved.getPassword());
        assertTrue(userService.checkPassword("password", saved.getPassword()));
    }

    @Test
    void findByEmail_shouldReturnUser() {
        User user = new User();
        user.setEmail("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        Optional<User> found = userService.findByEmail("test@example.com");
        assertTrue(found.isPresent());
        assertEquals("test@example.com", found.get().getEmail());
    }

    @Test
    void existsByEmail_shouldReturnTrueIfExists() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
        assertTrue(userService.existsByEmail("test@example.com"));
    }

    @Test
    void checkPassword_shouldReturnTrueForValidPassword() {
        User user = new User();
        user.setPassword("password");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        User saved = userService.registerUser(user);
        assertTrue(userService.checkPassword("password", saved.getPassword()));
    }
}
