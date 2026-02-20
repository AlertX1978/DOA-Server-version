import { query } from '../config/database';

// ---------------------------------------------------------------------------
// Result interfaces
// ---------------------------------------------------------------------------

export interface BrowseItemApprover {
  role: string;
  action: string;
  kind: string;
}

export interface BrowseItemResult {
  id: number;
  code: string;
  parent_code: string | null;
  title: string;
  description: string | null;
  comments: string | null;
  function_name: string | null;
  sort_order: number;
  approvalChain: BrowseItemApprover[];
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Get all browse items, optionally filtered by search term and/or function name.
 * Returns flat items with their approval chains; frontend builds the tree.
 */
export async function getAllBrowseItems(
  search?: string,
  functionName?: string
): Promise<BrowseItemResult[]> {
  let sql = `
    SELECT
      bi.id,
      bi.code,
      bi.parent_code,
      bi.title,
      bi.description,
      bi.comments,
      bi.function_name,
      bi.sort_order
    FROM browse_items bi
    WHERE 1 = 1
  `;
  const params: unknown[] = [];
  let paramIndex = 1;

  if (search) {
    sql += `
      AND (
        bi.code ILIKE $${paramIndex}
        OR bi.title ILIKE $${paramIndex}
        OR bi.description ILIKE $${paramIndex}
        OR bi.comments ILIKE $${paramIndex}
      )
    `;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (functionName) {
    sql += ` AND bi.function_name = $${paramIndex}`;
    params.push(functionName);
    paramIndex++;
  }

  sql += ` ORDER BY bi.sort_order, bi.code`;

  const itemsResult = await query<{
    id: number;
    code: string;
    parent_code: string | null;
    title: string;
    description: string | null;
    comments: string | null;
    function_name: string | null;
    sort_order: number;
  }>(sql, params);

  if (itemsResult.rows.length === 0) {
    return [];
  }

  // Fetch approvers for all returned items in a single query
  const itemIds = itemsResult.rows.map((row) => row.id);
  const approversResult = await query<{
    browse_item_id: number;
    role_name: string;
    action: string;
    kind: string;
    sort_order: number;
  }>(
    `SELECT
       bia.browse_item_id,
       r.name AS role_name,
       bia.action,
       bia.kind,
       bia.sort_order
     FROM browse_item_approvers bia
     JOIN roles r ON r.id = bia.role_id
     WHERE bia.browse_item_id = ANY($1)
     ORDER BY bia.browse_item_id, bia.sort_order`,
    [itemIds]
  );

  // Group approvers by browse_item_id
  const approversByItem = new Map<number, BrowseItemApprover[]>();
  for (const row of approversResult.rows) {
    const list = approversByItem.get(row.browse_item_id) || [];
    list.push({
      role: row.role_name,
      action: row.action,
      kind: row.kind,
    });
    approversByItem.set(row.browse_item_id, list);
  }

  // Combine items with their approval chains
  return itemsResult.rows.map((item) => ({
    id: item.id,
    code: item.code,
    parent_code: item.parent_code,
    title: item.title,
    description: item.description,
    comments: item.comments,
    function_name: item.function_name,
    sort_order: item.sort_order,
    approvalChain: approversByItem.get(item.id) || [],
  }));
}

/**
 * Get a single browse item by its code, including full approval chain.
 */
export async function getBrowseItemByCode(code: string): Promise<BrowseItemResult | null> {
  const itemResult = await query<{
    id: number;
    code: string;
    parent_code: string | null;
    title: string;
    description: string | null;
    comments: string | null;
    function_name: string | null;
    sort_order: number;
  }>(
    `SELECT id, code, parent_code, title, description, comments, function_name, sort_order
     FROM browse_items
     WHERE code = $1`,
    [code]
  );

  if (itemResult.rows.length === 0) {
    return null;
  }

  const item = itemResult.rows[0];

  const approversResult = await query<{
    role_name: string;
    action: string;
    kind: string;
    sort_order: number;
  }>(
    `SELECT r.name AS role_name, bia.action, bia.kind, bia.sort_order
     FROM browse_item_approvers bia
     JOIN roles r ON r.id = bia.role_id
     WHERE bia.browse_item_id = $1
     ORDER BY bia.sort_order`,
    [item.id]
  );

  return {
    id: item.id,
    code: item.code,
    parent_code: item.parent_code,
    title: item.title,
    description: item.description,
    comments: item.comments,
    function_name: item.function_name,
    sort_order: item.sort_order,
    approvalChain: approversResult.rows.map((row) => ({
      role: row.role_name,
      action: row.action,
      kind: row.kind,
    })),
  };
}

/**
 * Get all distinct function names from browse items.
 */
export async function getAllFunctions(): Promise<string[]> {
  const result = await query<{ function_name: string }>(
    `SELECT DISTINCT function_name
     FROM browse_items
     WHERE function_name IS NOT NULL AND function_name != ''
     ORDER BY function_name`
  );

  return result.rows.map((row) => row.function_name);
}
