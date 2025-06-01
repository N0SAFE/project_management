package com.example.demo.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Email Controller for internal email operations Note: All test endpoints have
 * been removed as per project requirements
 */
@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Slf4j
public class EmailController {
    // This controller is now reserved for future production email endpoints
    // All test endpoints have been removed as they are not allowed in this project
}
