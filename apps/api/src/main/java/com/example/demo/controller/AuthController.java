package com.example.demo.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.AuthenticationResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.model.RefreshToken;
import com.example.demo.model.User;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.JwtService;
import com.example.demo.service.RefreshTokenService;
import com.example.demo.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        if (userService.existsByEmail(user.getEmail())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email already in use");
            return ResponseEntity.badRequest().body(error);
        }
        User savedUser = userService.registerUser(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        logger.info("Login attempt for email: {}", loginRequest.getEmail());
        
        try {
            // Log the attempt
            logger.debug("Creating authentication token for email: {}", loginRequest.getEmail());
            
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            logger.info("Authentication successful for email: {}", loginRequest.getEmail());

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();

            logger.debug("Generating JWT token for user: {} (ID: {})", user.getEmail(), user.getId());

            String jwtToken = jwtService.generateToken(userPrincipal);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            logger.info("Login successful for user: {} (ID: {})", user.getEmail(), user.getId());

            // Create secure HTTP-only cookies
            ResponseCookie jwtCookie = ResponseCookie.from("accessToken", jwtToken)
                    .httpOnly(true)
                    .secure(false) // Set to true in production with HTTPS
                    .path("/")
                    .maxAge(24 * 60 * 60) // 24 hours
                    .sameSite("Lax")
                    .build();

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                    .httpOnly(true)
                    .secure(false) // Set to true in production with HTTPS
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60) // 7 days
                    .sameSite("Lax")
                    .build();

            // Return user data without tokens
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(AuthenticationResponse.builder()
                            .userId(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .tokenType("Cookie")
                            .build());
        } catch (Exception e) {
            logger.error("Login failed for email: {} - Error: {}", loginRequest.getEmail(), e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid credentials");
            return ResponseEntity.status(401).body(error);
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(jakarta.servlet.http.HttpServletRequest request) {
        try {
            // Extract refresh token from cookie
            String refreshTokenFromCookie = extractRefreshTokenFromCookies(request);
            
            if (refreshTokenFromCookie == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "No refresh token found");
                return ResponseEntity.status(403).body(error);
            }

            return refreshTokenService.findByToken(refreshTokenFromCookie)
                    .map(refreshTokenService::verifyExpiration)
                    .map(RefreshToken::getUser)
                    .map(user -> {
                        UserPrincipal userPrincipal = new UserPrincipal(user);
                        String newAccessToken = jwtService.generateToken(userPrincipal);
                        
                        // Create new access token cookie
                        ResponseCookie jwtCookie = ResponseCookie.from("accessToken", newAccessToken)
                                .httpOnly(true)
                                .secure(false) // Set to true in production with HTTPS
                                .path("/")
                                .maxAge(24 * 60 * 60) // 24 hours
                                .sameSite("Lax")
                                .build();

                        return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                                .body(AuthenticationResponse.builder()
                                        .userId(user.getId())
                                        .username(user.getUsername())
                                        .email(user.getEmail())
                                        .tokenType("Cookie")
                                        .build());
                    })
                    .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(403).body(error);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        logger.info("User logout request");

        // Create cookies to clear existing ones
        ResponseCookie jwtCookie = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(0) // Expire immediately
                .sameSite("Lax")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(0) // Expire immediately
                .sameSite("Lax")
                .build();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(response);
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkAuth(jakarta.servlet.http.HttpServletRequest request) {
        logger.debug("Authentication check request");

        try {
            // Get token from cookie
            String token = extractTokenFromCookies(request);
            
            if (token == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No authentication token found"));
            }

            // Validate token and get user info
            String email = jwtService.extractUsername(token); // extractUsername actually extracts email (subject)
            if (email != null) {
                User user = userService.findByEmail(email).orElse(null);
                if (user != null) {
                    UserPrincipal userPrincipal = new UserPrincipal(user);
                    if (jwtService.isTokenValid(token, userPrincipal)) {
                        return ResponseEntity.ok(AuthenticationResponse.builder()
                                .userId(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .tokenType("Cookie")
                                .build());
                    }
                }
            }

            return ResponseEntity.status(401).body(Map.of("error", "Invalid authentication token"));
        } catch (Exception e) {
            logger.error("Authentication check failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Authentication check failed"));
        }
    }

    private String extractTokenFromCookies(jakarta.servlet.http.HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private String extractRefreshTokenFromCookies(jakarta.servlet.http.HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
