package com.example.demo.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.ProjectInvitation;

@Repository
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, Long> {

    Optional<ProjectInvitation> findByToken(String token);

    @Query("SELECT pi FROM ProjectInvitation pi WHERE pi.project.id = :projectId AND pi.email = :email AND pi.status = 'PENDING' AND pi.expiresAt > :now")
    Optional<ProjectInvitation> findActiveInvitation(@Param("projectId") Long projectId, @Param("email") String email, @Param("now") LocalDateTime now);

    @Query("SELECT pi FROM ProjectInvitation pi WHERE pi.project.id = :projectId ORDER BY pi.createdAt DESC")
    List<ProjectInvitation> findByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT pi FROM ProjectInvitation pi WHERE pi.email = :email AND pi.status = 'PENDING' AND pi.expiresAt > :now")
    List<ProjectInvitation> findActiveInvitationsByEmail(@Param("email") String email, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE ProjectInvitation pi SET pi.status = 'EXPIRED' WHERE pi.expiresAt < :now AND pi.status = 'PENDING'")
    int expireOldInvitations(@Param("now") LocalDateTime now);

    boolean existsByProjectIdAndEmailAndStatus(Long projectId, String email, ProjectInvitation.InvitationStatus status);
}
