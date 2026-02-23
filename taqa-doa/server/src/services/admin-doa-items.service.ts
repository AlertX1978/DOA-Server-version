import { query, pool } from '../config/database';
import { writeAuditLog } from './admin.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DOAItemRow {
  id: number;
  code: string;
  description: string | null;
  applies_to: string | null;
  category_id: number | null;
  business_owner: string | null;
  delegable: string | null;
  interpretation: string | null;
  created_at: string;
  updated_at: string;
}

export interface DOAItemApproverRow {
  id?: number;
  role_id: number;
  role: string;
  action: string;
  sort_order: number;
}

export interface DOAItemWithApprovers extends DOAItemRow {
  category_name: string | null;
  approvers: DOAItemApproverRow[];
}

// ---------------------------------------------------------------------------
// DOA Items
// ---------------------------------------------------------------------------

export async function getAllDOAItems(
  categoryId?: number,
  search?: string
): Promise<DOAItemWithApprovers[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (categoryId) {
    conditions.push(`di.category_id = $${paramIndex++}`);
    params.push(categoryId);
  }

  if (search) {
    conditions.push(
      `(di.code ILIKE $${paramIndex} OR di.description ILIKE $${paramIndex} OR di.business_owner ILIKE $${paramIndex})`
    );
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const itemResult = await query<DOAItemRow & { category_name: string | null }>(
    `SELECT di.*, c.name AS category_name
     FROM doa_items di
     LEFT JOIN categories c ON c.id = di.category_id
     ${whereClause}
     ORDER BY di.code, di.id`,
    params
  );

  if (itemResult.rows.length === 0) return [];

  // Fetch all approvers
  const approverResult = await query<{
    doa_item_id: number;
    id: number;
    role_id: number;
    role_name: string;
    action: string;
    sort_order: number;
  }>(
    `SELECT da.id, da.doa_item_id, da.role_id,
            r.name AS role_name, da.action, da.sort_order
     FROM doa_item_approvers da
     JOIN roles r ON r.id = da.role_id
     ORDER BY da.sort_order, da.id`
  );

  const approverMap = new Map<number, DOAItemApproverRow[]>();
  for (const row of approverResult.rows) {
    const list = approverMap.get(row.doa_item_id) || [];
    list.push({
      id: row.id,
      role_id: row.role_id,
      role: row.role_name,
      action: row.action,
      sort_order: row.sort_order,
    });
    approverMap.set(row.doa_item_id, list);
  }

  return itemResult.rows.map((item) => ({
    ...item,
    approvers: approverMap.get(item.id) || [],
  }));
}

export async function getDOAItemById(id: number): Promise<DOAItemWithApprovers | null> {
  const itemResult = await query<DOAItemRow & { category_name: string | null }>(
    `SELECT di.*, c.name AS category_name
     FROM doa_items di
     LEFT JOIN categories c ON c.id = di.category_id
     WHERE di.id = $1`,
    [id]
  );
  const item = itemResult.rows[0];
  if (!item) return null;

  const approverResult = await query<{
    id: number;
    role_id: number;
    role_name: string;
    action: string;
    sort_order: number;
  }>(
    `SELECT da.id, da.role_id, r.name AS role_name, da.action, da.sort_order
     FROM doa_item_approvers da
     JOIN roles r ON r.id = da.role_id
     WHERE da.doa_item_id = $1
     ORDER BY da.sort_order, da.id`,
    [id]
  );

  return {
    ...item,
    approvers: approverResult.rows.map((r) => ({
      id: r.id,
      role_id: r.role_id,
      role: r.role_name,
      action: r.action,
      sort_order: r.sort_order,
    })),
  };
}

export async function createDOAItem(
  data: {
    code: string;
    description?: string | null;
    applies_to?: string | null;
    category_id?: number | null;
    business_owner?: string | null;
    delegable?: string | null;
    interpretation?: string | null;
  },
  userId?: string
): Promise<DOAItemRow> {
  const result = await query<DOAItemRow>(
    `INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, delegable, interpretation)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.code,
      data.description || null,
      data.applies_to || null,
      data.category_id || null,
      data.business_owner || null,
      data.delegable || null,
      data.interpretation || null,
    ]
  );

  if (userId) {
    await writeAuditLog(userId, 'create', 'doa_item', String(result.rows[0].id), null, result.rows[0]);
  }

  return result.rows[0];
}

export async function updateDOAItem(
  id: number,
  data: Partial<{
    code: string;
    description: string | null;
    applies_to: string | null;
    category_id: number | null;
    business_owner: string | null;
    delegable: string | null;
    interpretation: string | null;
  }>,
  userId?: string
): Promise<DOAItemRow | null> {
  const oldResult = await query<DOAItemRow>(
    `SELECT * FROM doa_items WHERE id = $1`,
    [id]
  );
  const oldRow = oldResult.rows[0];
  if (!oldRow) return null;

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'code', 'description', 'applies_to', 'category_id', 'business_owner', 'delegable', 'interpretation',
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

  const result = await query<DOAItemRow>(
    `UPDATE doa_items
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  if (userId && result.rows[0]) {
    await writeAuditLog(userId, 'update', 'doa_item', String(id), oldRow, result.rows[0]);
  }

  return result.rows[0] || null;
}

export async function deleteDOAItem(
  id: number,
  userId?: string
): Promise<void> {
  const oldResult = await query<DOAItemRow>(
    `SELECT * FROM doa_items WHERE id = $1`,
    [id]
  );
  const oldRow = oldResult.rows[0];

  await query(`DELETE FROM doa_items WHERE id = $1`, [id]);

  if (userId && oldRow) {
    await writeAuditLog(userId, 'delete', 'doa_item', String(id), oldRow, null);
  }
}

// ---------------------------------------------------------------------------
// DOA Item Approvers (replace-all strategy)
// ---------------------------------------------------------------------------

export async function replaceDOAItemApprovers(
  doaItemId: number,
  approvers: Array<{ role_id: number; action: string; sort_order: number }>,
  userId?: string
): Promise<DOAItemApproverRow[]> {
  // Fetch old approvers for audit
  const oldResult = await query<{
    role_id: number;
    role_name: string;
    action: string;
    sort_order: number;
  }>(
    `SELECT da.role_id, r.name AS role_name, da.action, da.sort_order
     FROM doa_item_approvers da
     JOIN roles r ON r.id = da.role_id
     WHERE da.doa_item_id = $1
     ORDER BY da.sort_order`,
    [doaItemId]
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `DELETE FROM doa_item_approvers WHERE doa_item_id = $1`,
      [doaItemId]
    );

    const inserted: DOAItemApproverRow[] = [];
    for (const approver of approvers) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [doaItemId, approver.role_id, approver.action, approver.sort_order]
      );

      const roleResult = await client.query<{ name: string }>(
        `SELECT name FROM roles WHERE id = $1`,
        [approver.role_id]
      );

      inserted.push({
        id: result.rows[0].id,
        role_id: approver.role_id,
        role: roleResult.rows[0]?.name || '',
        action: approver.action,
        sort_order: approver.sort_order,
      });
    }

    await client.query('COMMIT');

    if (userId) {
      await writeAuditLog(
        userId,
        'update',
        'doa_item_approvers',
        String(doaItemId),
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
