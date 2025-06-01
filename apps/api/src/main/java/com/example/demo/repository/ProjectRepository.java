package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    boolean existsByName(String name);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM project WHERE id = :projectId", nativeQuery = true)
    void deleteProjectById(@Param("projectId") Long projectId);
}
