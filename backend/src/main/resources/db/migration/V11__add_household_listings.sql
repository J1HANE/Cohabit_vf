CREATE TABLE household_listings (
    household_id BIGINT PRIMARY KEY,
    location VARCHAR(160),
    monthly_rent DECIMAL(10,2),
    bedrooms INT,
    contact_email VARCHAR(254),
    contact_phone VARCHAR(32),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    contact_user_id BIGINT,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE household_listing_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    household_id BIGINT NOT NULL,
    content_type VARCHAR(32) NOT NULL,
    content MEDIUMBLOB NOT NULL,
    FOREIGN KEY (household_id) REFERENCES household_listings(household_id) ON DELETE CASCADE
);
