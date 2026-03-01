-- Migration 002: Seed Categories
-- Insert all 14 organizational domain categories

INSERT INTO categories (id, name, sort_order) VALUES
(1, 'Corporate Organisation & Structure', 1),
(2, 'Board of Directors', 2),
(3, 'Strategies, Plans & Policies', 3),
(4, 'Commercial & Marketing', 4),
(5, 'Human Resources', 5),
(6, 'Treasury', 6),
(7, 'Finance & Accounting', 7),
(8, 'Tax', 8),
(9, 'Supply Chain', 9),
(10, 'QHSE', 10),
(11, 'Legal & Compliance', 11),
(12, 'Technology', 12),
(13, 'Risk & Insurance', 13),
(14, 'Internal Audit', 14);

SELECT setval('categories_id_seq', 14);
