package com.example.demo.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.ProjectService;
import com.example.demo.service.UserService;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    @Autowired
    private ProjectService projectService;
    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Map<String, String> body, Authentication authentication) {
        String name = body.get("name");
        String description = body.get("description");
        LocalDate startDate = LocalDate.parse(body.get("startDate"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User creator = userPrincipal.getUser();
        
        Project project = projectService.createProject(name, description, startDate, creator);
        return ResponseEntity.ok(project);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id) {
        return projectService.getProject(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ProjectMember>> getProjectMembers(@PathVariable Long id) {
        Project project = projectService.getProject(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return ResponseEntity.ok(projectService.getProjectMembers(project));
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteMember(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        Project project = projectService.getProject(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User admin = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, admin)) {
            return ResponseEntity.status(403).body("Only admins can invite members");
        }
        String email = body.get("email");
        ProjectMember.ProjectRole role = ProjectMember.ProjectRole.valueOf(body.get("role"));
        ProjectMember member = projectService.inviteMember(project, email, role);
        return ResponseEntity.ok(member);
    }

    @PostMapping("/{id}/members/{userId}/role")
    public ResponseEntity<?> changeMemberRole(@PathVariable Long id, @PathVariable Long userId, @RequestBody Map<String, String> body, Authentication authentication) {
        Project project = projectService.getProject(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User admin = userPrincipal.getUser();
        
        if (!projectService.isAdmin(project, admin)) {
            return ResponseEntity.status(403).body("Only admins can change roles");
        }
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ProjectMember.ProjectRole newRole = ProjectMember.ProjectRole.valueOf(body.get("role"));
        ProjectMember member = projectService.changeMemberRole(project, user, newRole);
        return ResponseEntity.ok(member);
    }
}
