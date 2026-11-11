-- Add created_by_id and created_at columns to tasks table
ALTER TABLE tasks 
ADD COLUMN created_by_id BIGINT NULL,
ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;

-- Add index for faster queries
CREATE INDEX idx_tasks_created_by_id ON tasks(created_by_id);
