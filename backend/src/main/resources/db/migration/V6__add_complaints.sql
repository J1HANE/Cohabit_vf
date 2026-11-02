CREATE TABLE complaints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(32) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    admin_response TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_complaints_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_complaints_status_created (status, created_at),
    INDEX idx_complaints_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;