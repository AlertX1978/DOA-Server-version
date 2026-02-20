-- Migration 004: Seed Glossary
-- Insert all 5 approval action types

INSERT INTO glossary (code, name, description, sort_order) VALUES
('I', 'Initiate', 'Start the process', 1),
('R', 'Review/Recommend', 'Conduct in-depth review', 2),
('E', 'Endorse', 'Provide formal support', 3),
('X', 'Approve', 'Authority to approve', 4),
('N', 'Notification', 'Receive notification only', 5);
