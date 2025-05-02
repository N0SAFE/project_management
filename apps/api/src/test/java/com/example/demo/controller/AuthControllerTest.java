package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthControllerTest {
    @Mock
    private UserService userService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void register_shouldReturnErrorIfEmailExists() {
        User user = new User();
        user.setEmail("test@example.com");
        when(userService.existsByEmail(user.getEmail())).thenReturn(true);
        ResponseEntity<?> response = authController.register(user);
        assertEquals(400, response.getStatusCodeValue());
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertEquals("Email already in use", body.get("error"));
    }

    @Test
    void register_shouldReturnUserIfSuccess() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setPassword("password");
        when(userService.existsByEmail(user.getEmail())).thenReturn(false);
        when(userService.registerUser(any(User.class))).thenReturn(user);
        ResponseEntity<?> response = authController.register(user);
        assertEquals(200, response.getStatusCodeValue());
        User returnedUser = (User) response.getBody();
        assertNotNull(returnedUser);
        assertNull(returnedUser.getPassword());
    }

    @Test
    void login_shouldReturnUserIfCredentialsValid() {
        String email = "test@example.com";
        String password = "password";
        User user = new User();
        user.setEmail(email);
        user.setPassword("hashed");
        when(userService.findByEmail(email)).thenReturn(Optional.of(user));
        when(userService.checkPassword(password, user.getPassword())).thenReturn(true);
        Map<String, String> loginData = new HashMap<>();
        loginData.put("email", email);
        loginData.put("password", password);
        ResponseEntity<?> response = authController.login(loginData);
        assertEquals(200, response.getStatusCodeValue());
        User returnedUser = (User) response.getBody();
        assertNotNull(returnedUser);
        assertNull(returnedUser.getPassword());
    }

    @Test
    void login_shouldReturnErrorIfCredentialsInvalid() {
        String email = "test@example.com";
        String password = "wrong";
        when(userService.findByEmail(email)).thenReturn(Optional.empty());
        Map<String, String> loginData = new HashMap<>();
        loginData.put("email", email);
        loginData.put("password", password);
        ResponseEntity<?> response = authController.login(loginData);
        assertEquals(401, response.getStatusCodeValue());
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertEquals("Invalid credentials", body.get("error"));
    }
}
