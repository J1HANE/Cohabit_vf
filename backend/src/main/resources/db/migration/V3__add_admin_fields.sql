-- Add role and suspended fields to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';
ALTER TABLE users ADD COLUMN suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP NULL;

-- Add suspended field to households table
ALTER TABLE households ADD COLUMN suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE households ADD COLUMN suspended_at TIMESTAMP NULL;

-- Create index on role for faster admin queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_suspended ON users(suspended);
CREATE INDEX idx_households_suspended ON households(suspended);
