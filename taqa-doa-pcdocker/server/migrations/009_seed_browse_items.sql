-- Migration 009: Seed Browse Items from DOA Items and Categories
-- Populates browse_items and browse_item_approvers tables for the Browse tab.
-- The frontend (DOABrowser.tsx) builds a hierarchical tree and creates synthetic
-- ancestor nodes for any missing intermediate codes (e.g. "Section 4.2").

-- 1. Insert the 14 category root nodes (codes "1" through "14")
INSERT INTO browse_items (code, parent_code, title, description, comments, function_name, sort_order)
SELECT
    c.id::TEXT AS code,
    NULL AS parent_code,
    c.name AS title,
    NULL AS description,
    NULL AS comments,
    NULL AS function_name,
    c.sort_order
FROM categories c
ORDER BY c.sort_order;

-- 2. Insert all doa_items as browse_items with derived parent_code
--    Mapping: doa_items.description -> browse_items.title
--             doa_items.interpretation -> browse_items.description
--             doa_items.applies_to -> browse_items.comments
--             doa_items.business_owner -> browse_items.function_name
INSERT INTO browse_items (code, parent_code, title, description, comments, function_name, sort_order)
SELECT
    di.code,
    -- Derive parent_code by stripping last dot-segment (e.g. '4.2.3.1' -> '4.2.3')
    CASE
        WHEN POSITION('.' IN di.code) = 0 THEN NULL
        ELSE LEFT(di.code, LENGTH(di.code) - LENGTH(SUBSTRING(di.code FROM '[^.]+$')) - 1)
    END AS parent_code,
    di.description AS title,
    di.interpretation AS description,
    CASE
        WHEN di.applies_to IS NOT NULL AND di.applies_to != '' THEN 'Applies to: ' || di.applies_to
        ELSE NULL
    END AS comments,
    di.business_owner AS function_name,
    ROW_NUMBER() OVER (ORDER BY di.code) + 100 AS sort_order
FROM doa_items di
ORDER BY di.code;

-- 3. Copy approvers from doa_item_approvers to browse_item_approvers
--    kind = 'A' (approval) for all since the original data doesn't distinguish kinds
INSERT INTO browse_item_approvers (browse_item_id, role_id, action, kind, sort_order)
SELECT
    bi.id AS browse_item_id,
    dia.role_id,
    dia.action,
    'A' AS kind,
    dia.sort_order
FROM doa_item_approvers dia
JOIN doa_items di ON di.id = dia.doa_item_id
JOIN browse_items bi ON bi.code = di.code
ORDER BY bi.id, dia.sort_order;
