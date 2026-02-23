import { query, pool } from '../config/database';
import { writeAuditLog } from './admin.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrowseItemRow {
  id: number;
  code: string;
  parent_code: string | null;
  title: string;
  description: string | null;
  comments: string | null;
  function_name: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BrowseItemWithApprovers extends BrowseItemRow {
  approvalChain: BrowseApproverRow[];
}

export interface BrowseApproverRow {
  id?: number;
  role_id: number;
  role: string;
  action: string;
  kind: string;
  sort_order: number;
}

export interface CategoryRow {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Browse Items
// ---------------------------------------------------------------------------

export async function getAllBrowseItems(
  search?: string,
  functionName?: string
): Promise<BrowseItemWithApprovers[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(
      `(bi.code ILIKE $${paramIndex} OR bi.title ILIKE $${paramIndex} OR bi.description ILIKE $${paramIndex} OR bi.comments ILIKE $${paramIndex})`
    );
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (functionName) {
    conditions.push(`bi.function_name = $${paramIndex}`);
    params.push(functionName);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const itemResult = await query<BrowseItemRow>(
    `SELECT id, code, parent_code, title, description, comments, function_name, sort_order, created_at, updated_at
     FROM browse_items bi
     ${whereClause}
     ORDER BY sort_order, id`,
    params
  );

  if (itemResult.rows.length === 0) return [];

  // Fetch all approvers in one query
  const approverResult = await query<{
    browse_item_id: number;
    id: number;
    role_id: number;
    role_name: string;
    action: string;
    kind: string;
    sort_order: number;
  }>(
    `SELECT ba.id, ba.browse_item_id, ba.role_id,
            r.name AS role_name, ba.action, ba.kind, ba.sort_order
     FROM browse_item_approvers ba
     JOIN roles r ON r.id = ba.role_id
     ORDER BY ba.sort_order, ba.id`
  );

  const approverMap = new Map<number, BrowseApproverRow[]>();
  for (const row of approverResult.rows) {
    const list = approverMap.get(row.browse_item_id) || [];
    list.push({
      id: row.id,
      role_id: row.role_id,
      role: row.role_name,
      action: row.action,
      kind: row.kind,
      sort_order: row.sort_order,
    });
    approverMap.set(row.browse_item_id, list);
  }

  return itemResult.rows.map((item) => ({
    ...item,
    approvalChain: approverMap.get(item.id) || [],
  }));
}

export async function getBrowseItemById(id: number): Promise<BrowseItemWithApprovers | null> {
  const itemResult = await query<BrowseItemRow>(
    `SELECT * FROM browse_items WHERE id = $1`,
    [id]
  );
  const item = itemResult.rows[0];
  if (!item) return null;

  const approverResult = await query<{
    id: number;
    role_id: number;
    role_name: string;
    action: string;
    kind: string;
    sort_order: number;
  }>(
    `SELECT ba.id, ba.role_id, r.name AS role_name, ba.action, ba.kind, ba.sort_order
     FROM browse_item_approvers ba
     JOIN roles r ON r.id = ba.role_id
     WHERE ba.browse_item_id = $1
     ORDER BY ba.sort_order, ba.id`,
    [id]
  );

  return {
    ...item,
    approvalChain: approverResult.rows.map((r) => ({
      id: r.id,
      role_id: r.role_id,
      role: r.role_name,
      action: r.action,
      kind: r.kind,
      sort_order: r.sort_order,
    })),
  };
}

export async function createBrowseItem(
  data: {
    code: string;
    parent_code?: string | null;
    title: string;
    description?: string | null;
    comments?: string | null;
    function_name?: string | null;
    sort_order?: number;
  },
  userId?: string
): Promise<BrowseItemRow> {
  const result = await query<BrowseItemRow>(
    `INSERT INTO browse_items (code, parent_code, title, description, comments, function_name, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.code,
      data.parent_code || null,
      data.title,
      data.description || null,
      data.comments || null,
      data.function_name || null,
      data.sort_order ?? 0,
    ]
  );

  if (userId) {
    await writeAuditLog(userId, 'create', 'browse_item', String(result.rows[0].id), null, result.rows[0]);
  }

  return result.rows[0];
}

export async function updateBrowseItem(
  id: number,
  data: Partial<{
    code: string;
    parent_code: string | null;
    title: string;
    description: string | null;
    comments: string | null;
    function_name: string | null;
    sort_order: number;
  }>,
  userId?: string
): Promise<BrowseItemRow | null> {
  const oldResult = await query<BrowseItemRow>(
    `SELECT * FROM browse_items WHERE id = $1`,
    [id]
  );
  const oldRow = oldResult.rows[0];
  if (!oldRow) return null;

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'code', 'parent_code', 'title', 'description', 'comments', 'function_name', 'sort_order',
  ] as const;

  for (const field of allowedFields) {
    if (field in data) {
      setClauses.push(`${field} = $${paramIndex++}`);
      params.push((data as Record<string, unknown>)[field]);
    }
  }

  if (setClauses.length === 0) return oldRow;

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query<BrowseItemRow>(
    `UPDATE browse_items
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  if (userId && result.rows[0]) {
    await writeAuditLog(userId, 'update', 'browse_item', String(id), oldRow, result.rows[0]);
  }

  return result.rows[0] || null;
}

export async function deleteBrowseItem(
  id: number,
  cascade: boolean,
  userId?: string
): Promise<{ deleted: number }> {
  const oldResult = await query<BrowseItemRow>(
    `SELECT * FROM browse_items WHERE id = $1`,
    [id]
  );
  const oldRow = oldResult.rows[0];
  if (!oldRow) return { deleted: 0 };

  // Check for children
  const childResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM browse_items WHERE parent_code = $1`,
    [oldRow.code]
  );
  const childCount = parseInt(childResult.rows[0].count, 10);

  if (childCount > 0 && !cascade) {
    throw new Error(`CHILDREN_EXIST:${childCount}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let deleted = 0;

    if (cascade && childCount > 0) {
      // Recursively delete children by code prefix
      const deleteChildrenResult = await client.query(
        `DELETE FROM browse_items WHERE parent_code = $1`,
        [oldRow.code]
      );
      deleted += deleteChildrenResult.rowCount || 0;
    }

    await client.query(`DELETE FROM browse_items WHERE id = $1`, [id]);
    deleted += 1;

    await client.query('COMMIT');

    if (userId) {
      await writeAuditLog(userId, 'delete', 'browse_item', String(id), oldRow, null);
    }

    return { deleted };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function reorderBrowseItems(
  items: Array<{ id: number; sort_order: number }>,
  userId?: string
): Promise<{ updated: number }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let updated = 0;

    for (const item of items) {
      const result = await client.query(
        `UPDATE browse_items SET sort_order = $1, updated_at = NOW() WHERE id = $2`,
        [item.sort_order, item.id]
      );
      updated += result.rowCount || 0;
    }

    await client.query('COMMIT');

    if (userId) {
      await writeAuditLog(userId, 'reorder', 'browse_item', null, null, { items });
    }

    return { updated };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Browse Item Approvers (replace-all strategy)
// ---------------------------------------------------------------------------

export async function replaceBrowseItemApprovers(
  browseItemId: number,
  approvers: Array<{ role_id: number; action: string; kind: string; sort_order: number }>,
  userId?: string
): Promise<BrowseApproverRow[]> {
  // Fetch old approvers for audit
  const oldResult = await query<{
    role_id: number;
    role_name: string;
    action: string;
    kind: string;
    sort_order: number;
  }>(
    `SELECT ba.role_id, r.name AS role_name, ba.action, ba.kind, ba.sort_order
     FROM browse_item_approvers ba
     JOIN roles r ON r.id = ba.role_id
     WHERE ba.browse_item_id = $1
     ORDER BY ba.sort_order`,
    [browseItemId]
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete existing
    await client.query(
      `DELETE FROM browse_item_approvers WHERE browse_item_id = $1`,
      [browseItemId]
    );

    // Insert new
    const inserted: BrowseApproverRow[] = [];
    for (const approver of approvers) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO browse_item_approvers (browse_item_id, role_id, action, kind, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [browseItemId, approver.role_id, approver.action, approver.kind, approver.sort_order]
      );

      // Fetch role name
      const roleResult = await client.query<{ name: string }>(
        `SELECT name FROM roles WHERE id = $1`,
        [approver.role_id]
      );

      inserted.push({
        id: result.rows[0].id,
        role_id: approver.role_id,
        role: roleResult.rows[0]?.name || '',
        action: approver.action,
        kind: approver.kind,
        sort_order: approver.sort_order,
      });
    }

    await client.query('COMMIT');

    if (userId) {
      await writeAuditLog(
        userId,
        'update',
        'browse_item_approvers',
        String(browseItemId),
        oldResult.rows,
        approvers
      );
    }

    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<CategoryRow[]> {
  const result = await query<CategoryRow>(
    `SELECT id, name, sort_order, created_at, updated_at
     FROM categories
     ORDER BY sort_order, id`
  );
  return result.rows;
}

export async function createCategory(
  data: { name: string; sort_order?: number },
  userId?: string
): Promise<CategoryRow> {
  const result = await query<CategoryRow>(
    `INSERT INTO categories (name, sort_order)
     VALUES ($1, $2)
     RETURNING *`,
    [data.name, data.sort_order ?? 0]
  );

  if (userId) {
    await writeAuditLog(userId, 'create', 'category', String(result.rows[0].id), null, result.rows[0]);
  }

  return result.rows[0];
}

export async function updateCategory(
  id: number,
  data: { name?: string; sort_order?: number },
  userId?: string
): Promise<CategoryRow | null> {
  const oldResult = await query<CategoryRow>(
    `SELECT * FROM categories WHERE id = $1`,
    [id]
  );
  const oldRow = oldResult.rows[0];
  if (!oldRow) return null;

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    params.push(data.name);
  }
  if (data.sort_order !== undefined) {
    setClauses.push(`sort_order = $${paramIndex++}`);
    params.push(data.sort_order);
  }

  if (setClauses.length === 0) return oldRow;

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query<CategoryRow>(
    `UPDATE categories
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  if (userId && result.rows[0]) {
    await writeAuditLog(userId, 'update', 'category', String(id), oldRow, result.rows[0]);
  }

  return result.rows[0] || null;
}

export async function deleteCategory(
  id: number,
  userId?: string
): Promise<void> {
  // Check for references
  const refResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM doa_items WHERE category_id = $1`,
    [id]
  );
  if (parseInt(refResult.rows[0].count, 10) > 0) {
    throw new Error('CATEGORY_IN_USE');
  }

  const oldResult = await query<CategoryRow>(
    `SELECT * FROM categories WHERE id = $1`,
    [id]
  );
  const oldRow = oldResult.rows[0];

  await query(`DELETE FROM categories WHERE id = $1`, [id]);

  if (userId && oldRow) {
    await writeAuditLog(userId, 'delete', 'category', String(id), oldRow, null);
  }
}
