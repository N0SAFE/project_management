-- Create project_invitations table for the invitation system
-- This table manages invitations to join projects with email-based workflow

CREATE TABLE project_invitations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    inviter_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP NULL,
    accepted_by_user_id BIGINT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_project_invitations_project 
        FOREIGN KEY (project_id) REFERENCES project(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_project_invitations_inviter 
        FOREIGN KEY (inviter_id) REFERENCES users(id) 
        ON DELETE RESTRICT,
        
    CONSTRAINT fk_project_invitations_accepted_by 
        FOREIGN KEY (accepted_by_user_id) REFERENCES users(id) 
        ON DELETE SET NULL,
    
    -- Prevent duplicate pending invitations for same email/project combination
    CONSTRAINT uq_project_email_pending 
        UNIQUE (project_id, email, status)
);

-- Create indexes for better query performance
CREATE INDEX idx_project_invitations_project_id ON project_invitations (project_id);
CREATE INDEX idx_project_invitations_email ON project_invitations (email);
CREATE INDEX idx_project_invitations_token ON project_invitations (token);
CREATE INDEX idx_project_invitations_status ON project_invitations (status);
CREATE INDEX idx_project_invitations_expires_at ON project_invitations (expires_at);
CREATE INDEX idx_project_invitations_created_at ON project_invitations (created_at);

-- Add some comments for documentation
-- role values: ADMIN, MEMBER, OBSERVER (matches ProjectMember.ProjectRole enum)
-- status values: PENDING, ACCEPTED, CANCELLED, EXPIRED (matches InvitationStatus enum)
-- token: unique identifier used in email links for accepting invitations
-- expires_at: typically set to 7 days from creation
-- accepted_by_user_id: links to the user who actually accepted the invitation (may differ from email if user registers with different details)
