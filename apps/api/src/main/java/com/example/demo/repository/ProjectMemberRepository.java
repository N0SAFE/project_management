package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Project;
import com.example.demo.model.ProjectMember;
import com.example.demo.model.User;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProject(Project project);
    Optional<ProjectMember> findByProjectAndUser(Project project, User user);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM ProjectMember pm WHERE pm.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
}
