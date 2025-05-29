package com.example.demo.service;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(User user) {
        logger.info("Registering new user with email: {}", user.getEmail());
        logger.debug("Original password length: {}", user.getPassword().length());
        
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);

        logger.debug("Encoded password: {}", encodedPassword);
        
        logger.debug("Encoded password preview: {}", encodedPassword.substring(0, Math.min(10, encodedPassword.length())) + "...");
        
        User savedUser = userRepository.save(user);
        logger.info("User registered successfully - ID: {}, Email: {}", savedUser.getId(), savedUser.getEmail());
        
        return savedUser;
    }

    public Optional<User> findByEmail(String email) {
        logger.debug("Finding user by email: {}", email);
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            logger.debug("User found with email: {}", email);
        } else {
            logger.debug("No user found with email: {}", email);
        }
        return user;
    }

    public boolean existsByEmail(String email) {
        boolean exists = userRepository.existsByEmail(email);
        logger.debug("User exists with email {}: {}", email, exists);
        return exists;
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        logger.debug("Checking password - Raw length: {}, Encoded preview: {}", 
                rawPassword.length(), 
                encodedPassword.substring(0, Math.min(10, encodedPassword.length())) + "...");
        
        boolean matches = passwordEncoder.matches(rawPassword, encodedPassword);
        logger.debug("Password check result: {}", matches);
        return matches;
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
