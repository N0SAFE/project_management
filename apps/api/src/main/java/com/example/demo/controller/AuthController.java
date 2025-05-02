package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        if (userService.existsByEmail(user.getEmail())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email already in use");
            return ResponseEntity.badRequest().body(error);
        }
        User savedUser = userService.registerUser(user);
        savedUser.setPassword(null); // Hide password
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");
        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isPresent() && userService.checkPassword(password, userOpt.get().getPassword())) {
            User user = userOpt.get();
            user.setPassword(null); // Hide password
            return ResponseEntity.ok(user);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid credentials");
            return ResponseEntity.status(401).body(error);
        }
    }
}
