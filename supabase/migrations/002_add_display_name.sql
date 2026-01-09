-- Add display_name column to users table
-- tiktok_handle stores @username, display_name stores the display name

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing rows to copy handle to display_name if null
UPDATE users SET display_name = tiktok_handle WHERE display_name IS NULL;

