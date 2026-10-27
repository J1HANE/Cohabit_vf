-- Add attachment_url column to expenses table for receipts/invoices
ALTER TABLE expenses ADD COLUMN attachment_url VARCHAR(500) NULL;
