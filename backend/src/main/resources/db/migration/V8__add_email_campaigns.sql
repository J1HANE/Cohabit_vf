-- Create email campaigns table for marketing newsletters
CREATE TABLE email_campaigns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    sent_at TIMESTAMP NULL,
    scheduled_at TIMESTAMP NULL,
    recipient_count INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_campaign_status CHECK (status IN ('DRAFT', 'SENT', 'SCHEDULED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster queries
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_at ON email_campaigns(created_at);
