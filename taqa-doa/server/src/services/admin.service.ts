import { query } from '../config/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogRow {
  id: number;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  created_at: string;
  user_email?: string;
  user_display_name?: string;
}

interface AuditLogOptions {
  limit?: number;
  offset?: number;
  entityType?: string;
  action?: string;
}

interface ThresholdApprover {
  role: string;
  action: string;
  label: string;
  sort_order: number;
}

interface ThresholdRow {
  id: number;
  threshold_id: string;
  type: string;
  name: string;
  code: string;
  min_value: number | null;
  max_value: number | null;
  min_capex: number | null;
  max_capex: number | null;
  min_markup: number | null;
  max_markup: number | null;
  max_gross_margin: number | null;
  condition_text: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  approvers: ThresholdApprover[];
}

export interface RoleRow {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountryRow {
  id: number;
  name: string;
  risk_level: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

/**
 * Retrieve paginated audit log entries, optionally filtered by entity type
 * and/or action. Joins with users to include email and display name.
 */
export async function getAuditLog(
  options: AuditLogOptions = {}
): Promise<{ rows: AuditLogRow[]; total: number }> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const offset = Math.max(options.offset ?? 0, 0);

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options.entityType) {
    conditions.push(`al.entity_type = $${paramIndex++}`);
    params.push(options.entityType);
  }
  if (options.action) {
    conditions.push(`al.action = $${paramIndex++}`);
    params.push(options.action);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM audit_log al ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Paginated rows with user join
  const dataParams = [...params, limit, offset];
  const dataResult = await query<AuditLogRow>(
    `SELECT al.id,
            al.user_id,
            al.action,
            al.entity_type,
            al.entity_id,
            al.old_value,
            al.new_value,
            al.ip_address,
            al.created_at,
            u.email        AS user_email,
            u.display_name AS user_display_name
     FROM audit_log al
     LEFT JOIN users u ON u.id = al.user_id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    dataParams
  );

  return { rows: dataResult.rows, total };
}

/**
 * Insert a new audit log entry.
 */
export async function writeAuditLog(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  oldValue: unknown,
  newValue: unknown,
  ipAddress?: string
): Promise<void> {
  await query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
    [
      userId,
      action,
      entityType,
      entityId,
      oldValue != null ? JSON.stringify(oldValue) : null,
      newValue != null ? JSON.stringify(newValue) : null,
      ipAddress || null,
    ]
  );
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/**
 * Get all thresholds with their associated approvers.
 * Each threshold includes an `approvers` array built by joining
 * threshold_approvers and roles.
 */
export async function getThresholdsWithApprovers(): Promise<ThresholdRow[]> {
  // Fetch all thresholds
  const thresholdResult = await query<Omit<ThresholdRow, 'approvers'>>(
    `SELECT id, threshold_id, type, name, code,
            min_value, max_value, min_capex, max_capex,
            min_markup, max_markup, max_gross_margin,
            condition_text, notes, sort_order,
            created_at, updated_at
     FROM thresholds
     ORDER BY sort_order, id`
  );

  if (thresholdResult.rows.length === 0) {
    return [];
  }

  // Fetch all approvers in one query
  const approverResult = await query<{
    threshold_id: number;
    role_name: string;
    action: string;
    label: string;
    sort_order: number;
  }>(
    `SELECT ta.threshold_id,
            r.name    AS role_name,
            ta.action,
            ta.label,
            ta.sort_order
     FROM threshold_approvers ta
     JOIN roles r ON r.id = ta.role_id
     ORDER BY ta.sort_order`
  );

  // Group approvers by threshold_id
  const approverMap = new Map<number, ThresholdApprover[]>();
  for (const row of approverResult.rows) {
    const list = approverMap.get(row.threshold_id) || [];
    list.push({
      role: row.role_name,
      action: row.action,
      label: row.label,
      sort_order: row.sort_order,
    });
    approverMap.set(row.threshold_id, list);
  }

  // Merge
  return thresholdResult.rows.map((t) => ({
    ...t,
    approvers: approverMap.get(t.id) || [],
  }));
}

/**
 * Update a threshold's editable fields and log the change.
 */
export async function updateThreshold(
  thresholdId: number,
  data: Partial<{
    name: string;
    code: string;
    notes: string | null;
    min_value: number | null;
    max_value: number | null;
    min_capex: number | null;
    max_capex: number | null;
    min_markup: number | null;
    max_markup: number | null;
    max_gross_margin: number | null;
    condition_text: string | null;
    sort_order: number;
  }>,
  userId?: string
): Promise<ThresholdRow | null> {
  // Fetch old record for audit
  const oldResult = await query<Omit<ThresholdRow, 'approvers'>>(
    `SELECT * FROM thresholds WHERE id = $1`,
    [thresholdId]
  );
  const oldRow = oldResult.rows[0];
  if (!oldRow) return null;

  // Build dynamic SET clause
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'name', 'code', 'notes', 'min_value', 'max_value',
    'min_capex', 'max_capex', 'min_markup', 'max_markup',
    'max_gross_margin', 'condition_text', 'sort_order',
  ] as const;

  for (const field of allowedFields) {
    if (field in data) {
      setClauses.push(`${field} = $${paramIndex++}`);
      params.push((data as Record<string, unknown>)[field]);
    }
  }

  if (setClauses.length === 0) {
    // Nothing to update — return existing threshold with approvers
    const full = await getThresholdsWithApprovers();
    return full.find((t) => t.id === thresholdId) || null;
  }

  // Always bump updated_at
  setClauses.push(`updated_at = NOW()`);
  params.push(thresholdId);

  const updated = await query<Omit<ThresholdRow, 'approvers'>>(
    `UPDATE thresholds
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  // Audit log
  if (userId) {
    await writeAuditLog(
      userId,
      'update',
      'threshold',
      String(thresholdId),
      oldRow,
      updated.rows[0]
    );
  }

  // Return with approvers
  const full = await getThresholdsWithApprovers();
  return full.find((t) => t.id === thresholdId) || null;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/**
 * List all roles ordered by sort_order.
 */
export async function getRoles(): Promise<RoleRow[]> {
  const result = await query<RoleRow>(
    `SELECT id, name, sort_order, is_active, created_at, updated_at
     FROM roles
     ORDER BY sort_order, id`
  );
  return result.rows;
}

/**
 * Update an existing role.
 */
export async function updateRole(
  id: number,
  data: { name?: string; sort_order?: number; is_active?: boolean },
  userId?: string
): Promise<RoleRow | null> {
  // Fetch old record for audit
  const oldResult = await query<RoleRow>(
    `SELECT * FROM roles WHERE id = $1`,
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
  if (data.is_active !== undefined) {
    setClauses.push(`is_active = $${paramIndex++}`);
    params.push(data.is_active);
  }

  if (setClauses.length === 0) return oldRow;

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query<RoleRow>(
    `UPDATE roles
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  if (userId && result.rows[0]) {
    await writeAuditLog(userId, 'update', 'role', String(id), oldRow, result.rows[0]);
  }

  return result.rows[0] || null;
}

/**
 * Create a new role.
 */
export async function createRole(
  data: { name: string; sort_order?: number },
  userId?: string
): Promise<RoleRow> {
  const sortOrder = data.sort_order ?? 0;

  const result = await query<RoleRow>(
    `INSERT INTO roles (name, sort_order)
     VALUES ($1, $2)
     RETURNING *`,
    [data.name, sortOrder]
  );

  if (userId) {
    await writeAuditLog(userId, 'create', 'role', String(result.rows[0].id), null, result.rows[0]);
  }

  return result.rows[0];
}

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

/**
 * List all countries ordered by name.
 */
export async function getCountries(): Promise<CountryRow[]> {
  const result = await query<CountryRow>(
    `SELECT id, name, risk_level, created_at, updated_at
     FROM countries
     ORDER BY name`
  );
  return result.rows;
}

/**
 * Update a country's risk level.
 */
export async function updateCountryRisk(
  id: number,
  riskLevel: string,
  userId?: string
): Promise<CountryRow | null> {
  const oldResult = await query<CountryRow>(
    `SELECT * FROM countries WHERE id = $1`,
    [id]
  );
  const oldRow = oldResult.rows[0];
  if (!oldRow) return null;

  const result = await query<CountryRow>(
    `UPDATE countries SET risk_level = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [riskLevel, id]
  );

  if (userId && result.rows[0]) {
    await writeAuditLog(userId, 'update', 'country', String(id), oldRow, result.rows[0]);
  }

  return result.rows[0] || null;
}

/**
 * Add a new country with a risk level.
 */
export async function addCountry(
  name: string,
  riskLevel: string,
  userId?: string
): Promise<CountryRow> {
  const result = await query<CountryRow>(
    `INSERT INTO countries (name, risk_level)
     VALUES ($1, $2)
     RETURNING *`,
    [name, riskLevel]
  );

  if (userId) {
    await writeAuditLog(userId, 'create', 'country', String(result.rows[0].id), null, result.rows[0]);
  }

  return result.rows[0];
}

/**
 * Delete a country by ID.
 */
export async function deleteCountry(
  id: number,
  userId?: string
): Promise<void> {
  // Fetch for audit before deleting
  const oldResult = await query<CountryRow>(
    `SELECT * FROM countries WHERE id = $1`,
    [id]
  );
  const oldRow = oldResult.rows[0];

  await query(`DELETE FROM countries WHERE id = $1`, [id]);

  if (userId && oldRow) {
    await writeAuditLog(userId, 'delete', 'country', String(id), oldRow, null);
  }
}
