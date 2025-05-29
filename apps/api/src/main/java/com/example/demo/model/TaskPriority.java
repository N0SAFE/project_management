package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "task_priority", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "name"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskPriority {
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
    private Integer level = 1; // Higher number = higher priority

    @Column(nullable = false)
    private Boolean isDefault = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private State todoState = State.TODO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private State doingState = State.DOING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private State finishState = State.FINISH;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnoreProperties({"members", "hibernateLazyInitializer", "handler"})
    private Project project;

    public enum State {
        TODO("À faire"),
        DOING("En cours"),
        FINISH("Terminé");

        private final String label;

        State(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}
