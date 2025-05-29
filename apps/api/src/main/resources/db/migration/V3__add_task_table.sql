-- Flyway Migration: Add task table for task management

CREATE TABLE task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'TODO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    project_id BIGINT NOT NULL,
    assignee_id BIGINT,
    CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX idx_task_project_id ON task(project_id);
CREATE INDEX idx_task_assignee_id ON task(assignee_id);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_priority ON task(priority);
CREATE INDEX idx_task_due_date ON task(due_date);
