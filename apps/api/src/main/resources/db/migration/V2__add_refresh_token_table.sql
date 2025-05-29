-- Flyway Migration: Add refresh_token table for JWT authentication

CREATE TABLE refresh_token (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add index for performance on token lookups
CREATE INDEX idx_refresh_token_token ON refresh_token(token);
CREATE INDEX idx_refresh_token_user_id ON refresh_token(user_id);
CREATE INDEX idx_refresh_token_expiry ON refresh_token(expiry_date);
