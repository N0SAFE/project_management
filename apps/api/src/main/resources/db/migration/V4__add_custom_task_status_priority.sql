-- Flyway Migration: Add custom task status and priority tables

-- Create task_status table
CREATE TABLE task_status (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    order_index INT NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    project_id BIGINT NOT NULL,
    CONSTRAINT fk_task_status_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT uq_task_status_project_name UNIQUE (project_id, name)
);

-- Create task_priority table
CREATE TABLE task_priority (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    level INT NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    todo_state VARCHAR(20) NOT NULL DEFAULT 'TODO',
    doing_state VARCHAR(20) NOT NULL DEFAULT 'DOING',
    finish_state VARCHAR(20) NOT NULL DEFAULT 'FINISH',
    project_id BIGINT NOT NULL,
    CONSTRAINT fk_task_priority_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT uq_task_priority_project_name UNIQUE (project_id, name)
);

-- Add new columns to task table (H2 requires separate ALTER statements)
ALTER TABLE task ADD COLUMN priority_id BIGINT;
ALTER TABLE task ADD COLUMN status_id BIGINT;

-- Add foreign key constraints
ALTER TABLE task ADD CONSTRAINT fk_task_priority_id FOREIGN KEY (priority_id) REFERENCES task_priority(id) ON DELETE SET NULL;
ALTER TABLE task ADD CONSTRAINT fk_task_status_id FOREIGN KEY (status_id) REFERENCES task_status(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_task_status_project_id ON task_status(project_id);
CREATE INDEX idx_task_status_order ON task_status(project_id, order_index);
CREATE INDEX idx_task_priority_project_id ON task_priority(project_id);
CREATE INDEX idx_task_priority_level ON task_priority(project_id, level);
CREATE INDEX idx_task_priority_id ON task(priority_id);
CREATE INDEX idx_task_status_id ON task(status_id);

-- Insert default statuses and priorities for existing projects
INSERT INTO task_status (name, description, color, order_index, is_default, project_id)
SELECT 'À faire', 'Tâches qui doivent être commencées', '#6B7280', 1, TRUE, p.id
FROM project p;

INSERT INTO task_status (name, description, color, order_index, is_default, project_id)
SELECT 'En cours', 'Tâches actuellement en développement', '#F59E0B', 2, FALSE, p.id
FROM project p;

INSERT INTO task_status (name, description, color, order_index, is_default, project_id)
SELECT 'Terminé', 'Tâches complètement achevées', '#10B981', 3, FALSE, p.id
FROM project p;

INSERT INTO task_priority (name, description, color, level, is_default, todo_state, doing_state, finish_state, project_id)
SELECT 'Basse', 'Priorité faible - peut être fait plus tard', '#6B7280', 1, FALSE, 'TODO', 'DOING', 'FINISH', p.id
FROM project p;

INSERT INTO task_priority (name, description, color, level, is_default, todo_state, doing_state, finish_state, project_id)
SELECT 'Normale', 'Priorité normale - travail standard', '#3B82F6', 2, TRUE, 'TODO', 'DOING', 'FINISH', p.id
FROM project p;

INSERT INTO task_priority (name, description, color, level, is_default, todo_state, doing_state, finish_state, project_id)
SELECT 'Haute', 'Priorité élevée - doit être fait rapidement', '#EF4444', 3, FALSE, 'TODO', 'DOING', 'FINISH', p.id
FROM project p;

-- Update existing tasks to use the new default status and priority
UPDATE task t 
SET status_id = (
    SELECT ts.id 
    FROM task_status ts 
    WHERE ts.project_id = t.project_id 
    AND ts.is_default = TRUE 
    AND ts.name = CASE 
        WHEN t.status = 'TODO' THEN 'À faire'
        WHEN t.status = 'IN_PROGRESS' THEN 'En cours'
        WHEN t.status = 'DONE' THEN 'Terminé'
        ELSE 'À faire'
    END
    LIMIT 1
);

UPDATE task t 
SET priority_id = (
    SELECT tp.id 
    FROM task_priority tp 
    WHERE tp.project_id = t.project_id 
    AND tp.is_default = TRUE 
    AND tp.name = CASE 
        WHEN t.priority = 'LOW' THEN 'Basse'
        WHEN t.priority = 'MEDIUM' THEN 'Normale'
        WHEN t.priority = 'HIGH' THEN 'Haute'
        ELSE 'Normale'
    END
    LIMIT 1
);

-- Remove old enum columns (keeping for backward compatibility for now)
-- ALTER TABLE task DROP COLUMN priority;
-- ALTER TABLE task DROP COLUMN status;
