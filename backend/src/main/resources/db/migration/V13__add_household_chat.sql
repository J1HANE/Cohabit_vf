CREATE TABLE household_chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    household_id BIGINT NOT NULL,
    sender_id BIGINT,
    sender_name VARCHAR(100) CHARACTER SET utf8mb4 NOT NULL,
    body VARCHAR(2000) CHARACTER SET utf8mb4 NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (household_id, id),
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE household_chat_reads (
    household_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    last_read_id BIGINT NOT NULL,
    PRIMARY KEY (household_id, user_id),
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
