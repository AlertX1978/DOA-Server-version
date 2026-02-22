-- Migration 011: Performance indexes for DOA editor
-- These indexes improve query performance for admin CRUD operations.

CREATE INDEX IF NOT EXISTS idx_browse_items_parent_sort
  ON browse_items(parent_code, sort_order);

CREATE INDEX IF NOT EXISTS idx_doa_item_approvers_item
  ON doa_item_approvers(doa_item_id);

CREATE INDEX IF NOT EXISTS idx_browse_item_approvers_item
  ON browse_item_approvers(browse_item_id);

CREATE INDEX IF NOT EXISTS idx_doa_items_category
  ON doa_items(category_id);
