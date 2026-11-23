CREATE TABLE marketplace_items (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    household_id  BIGINT         NULL,
    seller_id     BIGINT         NOT NULL,
    title         VARCHAR(160)   NOT NULL,
    description   TEXT           NULL,
    price         DECIMAL(10,2)  NOT NULL,
    price_type    VARCHAR(20)    NOT NULL DEFAULT 'FIXED',
    category      VARCHAR(50)    NOT NULL,
    item_size     VARCHAR(50)    NULL,
    item_condition VARCHAR(30)   NOT NULL DEFAULT 'GOOD',
    status        VARCHAR(20)    NOT NULL DEFAULT 'AVAILABLE',
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_marketplace_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    CONSTRAINT fk_marketplace_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_marketplace_status (status),
    INDEX idx_marketplace_category (category),
    INDEX idx_marketplace_household (household_id),
    INDEX idx_marketplace_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE marketplace_item_photos (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id       BIGINT       NOT NULL,
    content_type  VARCHAR(32)  NOT NULL,
    content       MEDIUMBLOB   NOT NULL,
    CONSTRAINT fk_marketplace_photos_item FOREIGN KEY (item_id) REFERENCES marketplace_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
