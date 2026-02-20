-- Migration 005: Seed Application Settings
-- Insert default application settings

INSERT INTO app_settings (key, value) VALUES
('count_x_without_number', '{"enabled": false}'::jsonb);
