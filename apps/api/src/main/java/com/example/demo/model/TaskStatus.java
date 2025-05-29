package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "task_status", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "name"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 1, max = 50)
    @Column(nullable = false)
    private String name;

    @Size(max = 255)
    private String description;

    @Column(nullable = false)
    private String color = "#6B7280"; // Default gray color

    @Column(nullable = false)
    private Integer orderIndex = 0;

    @Column(nullable = false)
    private Boolean isDefault = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Project project;
}
