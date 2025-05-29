package com.example.demo.controller;

import com.example.demo.dto.AuthenticationResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.model.RefreshToken;
import com.example.demo.model.User;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.JwtService;
import com.example.demo.service.RefreshTokenService;
import com.example.demo.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthControllerTest {
    @Mock
    private UserService userService;
    
    @Mock
    private JwtService jwtService;
    
    @Mock
    private RefreshTokenService refreshTokenService;
    
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Setup JWT service mock
        when(jwtService.generateToken(any())).thenReturn("mock-jwt-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("mock-refresh-token");
        
        // Setup refresh token service mock
        RefreshToken mockRefreshToken = new RefreshToken();
        mockRefreshToken.setToken("mock-refresh-token");
        when(refreshTokenService.createRefreshToken(any())).thenReturn(mockRefreshToken);
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
        user.setId(1L);
        user.setEmail(email);
        user.setPassword("hashed");
        user.setUsername("testuser");
        
        UserPrincipal userPrincipal = new UserPrincipal(user);
        Authentication mockAuth = mock(Authentication.class);
        when(mockAuth.getPrincipal()).thenReturn(userPrincipal);
        
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuth);
        
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);
        
        ResponseEntity<?> response = authController.login(loginRequest);
        assertEquals(200, response.getStatusCodeValue());
        AuthenticationResponse authResponse = (AuthenticationResponse) response.getBody();
        assertNotNull(authResponse);
        assertNotNull(authResponse.getAccessToken());
        assertEquals("mock-jwt-token", authResponse.getAccessToken());
    }

    @Test
    void login_shouldReturnErrorIfCredentialsInvalid() {
        String email = "test@example.com";
        String password = "wrong";
        
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Invalid credentials"));
        
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);
        ResponseEntity<?> response = authController.login(loginRequest);
        assertEquals(401, response.getStatusCodeValue());
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("Invalid credentials", body.get("error"));
    }
}
