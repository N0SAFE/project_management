-- Create task_history table for audit trail functionality
-- This table tracks all modifications made to tasks including field changes, assignments, and status updates

CREATE TABLE task_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL,
    modified_by BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_task_history_task 
        FOREIGN KEY (task_id) REFERENCES task(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_task_history_user 
        FOREIGN KEY (modified_by) REFERENCES users(id) 
        ON DELETE RESTRICT
);

-- Create indexes for better query performance
CREATE INDEX idx_task_history_task_id ON task_history (task_id);
CREATE INDEX idx_task_history_timestamp ON task_history (timestamp);
CREATE INDEX idx_task_history_modified_by ON task_history (modified_by);
CREATE INDEX idx_task_history_action ON task_history (action);

-- Add some sample data comments for documentation
-- action values: CREATE, UPDATE, DELETE, ASSIGN, UNASSIGN, STATUS_CHANGE, PRIORITY_CHANGE
-- field_name examples: name, description, dueDate, assignee, status, priority
-- This table will automatically track all task modifications for audit purposes
