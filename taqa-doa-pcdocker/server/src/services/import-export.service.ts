import { query, pool } from '../config/database';
import { writeAuditLog } from './admin.service';

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportEntities(
  entities: string[]
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    entities: {},
  };
  const data = result.entities as Record<string, unknown>;

  if (entities.includes('categories')) {
    const r = await query(`SELECT * FROM categories ORDER BY sort_order, id`);
    data.categories = r.rows;
  }

  if (entities.includes('roles')) {
    const r = await query(`SELECT * FROM roles ORDER BY sort_order, id`);
    data.roles = r.rows;
  }

  if (entities.includes('browse_items')) {
    const items = await query(`SELECT * FROM browse_items ORDER BY sort_order, id`);
    const approvers = await query(
      `SELECT ba.browse_item_id, r.name AS role_name, ba.action, ba.kind, ba.sort_order
       FROM browse_item_approvers ba
       JOIN roles r ON r.id = ba.role_id
       ORDER BY ba.sort_order`
    );

    const approverMap = new Map<number, unknown[]>();
    for (const row of approvers.rows as any[]) {
      const list = approverMap.get(row.browse_item_id) || [];
      list.push({
        role_name: row.role_name,
        action: row.action,
        kind: row.kind,
        sort_order: row.sort_order,
      });
      approverMap.set(row.browse_item_id, list);
    }

    data.browse_items = (items.rows as any[]).map((item) => ({
      ...item,
      approvers: approverMap.get(item.id) || [],
    }));
  }

  if (entities.includes('doa_items')) {
    const items = await query(
      `SELECT di.*, c.name AS category_name
       FROM doa_items di
       LEFT JOIN categories c ON c.id = di.category_id
       ORDER BY di.code, di.id`
    );
    const approvers = await query(
      `SELECT da.doa_item_id, r.name AS role_name, da.action, da.sort_order
       FROM doa_item_approvers da
       JOIN roles r ON r.id = da.role_id
       ORDER BY da.sort_order`
    );

    const approverMap = new Map<number, unknown[]>();
    for (const row of approvers.rows as any[]) {
      const list = approverMap.get(row.doa_item_id) || [];
      list.push({
        role_name: row.role_name,
        action: row.action,
        sort_order: row.sort_order,
      });
      approverMap.set(row.doa_item_id, list);
    }

    data.doa_items = (items.rows as any[]).map((item) => ({
      ...item,
      approvers: approverMap.get(item.id) || [],
    }));
  }

  if (entities.includes('thresholds')) {
    const items = await query(`SELECT * FROM thresholds ORDER BY sort_order, id`);
    const approvers = await query(
      `SELECT ta.threshold_id, r.name AS role_name, ta.action, ta.label, ta.sort_order
       FROM threshold_approvers ta
       JOIN roles r ON r.id = ta.role_id
       ORDER BY ta.sort_order`
    );

    const approverMap = new Map<number, unknown[]>();
    for (const row of approvers.rows as any[]) {
      const list = approverMap.get(row.threshold_id) || [];
      list.push({
        role_name: row.role_name,
        action: row.action,
        label: row.label,
        sort_order: row.sort_order,
      });
      approverMap.set(row.threshold_id, list);
    }

    data.thresholds = (items.rows as any[]).map((item) => ({
      ...item,
      approvers: approverMap.get(item.id) || [],
    }));
  }

  if (entities.includes('countries')) {
    const r = await query(`SELECT * FROM countries ORDER BY name`);
    data.countries = r.rows;
  }

  if (entities.includes('glossary')) {
    const r = await query(`SELECT * FROM glossary ORDER BY sort_order, id`);
    data.glossary = r.rows;
  }

  if (entities.includes('settings')) {
    const r = await query(`SELECT * FROM app_settings ORDER BY key`);
    data.settings = r.rows;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Import validation
// ---------------------------------------------------------------------------

interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
}

export async function validateImport(
  importData: Record<string, unknown>
): Promise<ImportValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts: Record<string, number> = {};

  const entities = importData.entities as Record<string, unknown[]> | undefined;
  if (!entities || typeof entities !== 'object') {
    errors.push('Missing or invalid "entities" field in import data');
    return { valid: false, errors, warnings, counts };
  }

  // Validate each entity array
  for (const [key, arr] of Object.entries(entities)) {
    if (!Array.isArray(arr)) {
      errors.push(`Entity "${key}" must be an array`);
      continue;
    }
    counts[key] = arr.length;

    if (key === 'browse_items') {
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i] as Record<string, unknown>;
        if (!item.code) errors.push(`browse_items[${i}]: missing code`);
        if (!item.title) errors.push(`browse_items[${i}]: missing title`);
      }
    }

    if (key === 'roles') {
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i] as Record<string, unknown>;
        if (!item.name) errors.push(`roles[${i}]: missing name`);
      }
    }

    if (key === 'doa_items') {
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i] as Record<string, unknown>;
        if (!item.code) errors.push(`doa_items[${i}]: missing code`);
      }
    }
  }

  // Check for role references in approvers
  const existingRoles = await query<{ name: string }>(`SELECT name FROM roles`);
  const roleNames = new Set(existingRoles.rows.map((r) => r.name));

  if (entities.browse_items) {
    for (const item of entities.browse_items as any[]) {
      if (item.approvers) {
        for (const approver of item.approvers as any[]) {
          if (approver.role_name && !roleNames.has(approver.role_name)) {
            warnings.push(`Browse item "${item.code}": references unknown role "${approver.role_name}"`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings, counts };
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export async function importEntities(
  importData: Record<string, unknown>,
  mode: 'merge' | 'replace',
  userId?: string
): Promise<Record<string, number>> {
  const entities = importData.entities as Record<string, unknown[]>;
  const imported: Record<string, number> = {};

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Import roles first (other entities reference them)
    if (entities.roles) {
      const roles = entities.roles as any[];
      if (mode === 'replace') {
        // Can't truncate roles due to FK constraints; use upsert instead
      }
      let count = 0;
      for (const role of roles) {
        await client.query(
          `INSERT INTO roles (name, sort_order, is_active)
           VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE SET sort_order = $2, is_active = $3, updated_at = NOW()`,
          [role.name, role.sort_order ?? 0, role.is_active ?? true]
        );
        count++;
      }
      imported.roles = count;
    }

    // Import categories
    if (entities.categories) {
      const cats = entities.categories as any[];
      if (mode === 'replace') {
        // Can't truncate due to FK; use upsert
      }
      let count = 0;
      for (const cat of cats) {
        await client.query(
          `INSERT INTO categories (name, sort_order)
           VALUES ($1, $2)
           ON CONFLICT (name) DO UPDATE SET sort_order = $2, updated_at = NOW()`,
          [cat.name, cat.sort_order ?? 0]
        );
        count++;
      }
      imported.categories = count;
    }

    // Import countries
    if (entities.countries) {
      const countries = entities.countries as any[];
      if (mode === 'replace') {
        await client.query(`DELETE FROM countries`);
      }
      let count = 0;
      for (const c of countries) {
        await client.query(
          `INSERT INTO countries (name, risk_level)
           VALUES ($1, $2)
           ON CONFLICT (name) DO UPDATE SET risk_level = $2, updated_at = NOW()`,
          [c.name, c.risk_level]
        );
        count++;
      }
      imported.countries = count;
    }

    // Import glossary
    if (entities.glossary) {
      const entries = entities.glossary as any[];
      if (mode === 'replace') {
        await client.query(`DELETE FROM glossary`);
      }
      let count = 0;
      for (const g of entries) {
        await client.query(
          `INSERT INTO glossary (code, name, description, sort_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO UPDATE SET name = $2, description = $3, sort_order = $4`,
          [g.code, g.name, g.description || null, g.sort_order ?? 0]
        );
        count++;
      }
      imported.glossary = count;
    }

    // Import browse items
    if (entities.browse_items) {
      const items = entities.browse_items as any[];
      if (mode === 'replace') {
        await client.query(`TRUNCATE browse_items CASCADE`);
      }
      let count = 0;
      for (const item of items) {
        const result = await client.query<{ id: number }>(
          `INSERT INTO browse_items (code, parent_code, title, description, comments, function_name, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            item.code,
            item.parent_code || null,
            item.title,
            item.description || null,
            item.comments || null,
            item.function_name || null,
            item.sort_order ?? 0,
          ]
        );
        const newId = result.rows[0].id;

        // Insert approvers
        if (item.approvers && Array.isArray(item.approvers)) {
          for (const approver of item.approvers) {
            // Resolve role by name
            const roleResult = await client.query<{ id: number }>(
              `SELECT id FROM roles WHERE name = $1`,
              [approver.role_name]
            );
            if (roleResult.rows[0]) {
              await client.query(
                `INSERT INTO browse_item_approvers (browse_item_id, role_id, action, kind, sort_order)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  newId,
                  roleResult.rows[0].id,
                  approver.action,
                  approver.kind || 'A',
                  approver.sort_order ?? 0,
                ]
              );
            }
          }
        }
        count++;
      }
      imported.browse_items = count;
    }

    // Import DOA items
    if (entities.doa_items) {
      const items = entities.doa_items as any[];
      if (mode === 'replace') {
        await client.query(`TRUNCATE doa_items CASCADE`);
      }
      let count = 0;
      for (const item of items) {
        // Resolve category
        let categoryId: number | null = null;
        if (item.category_name) {
          const catResult = await client.query<{ id: number }>(
            `SELECT id FROM categories WHERE name = $1`,
            [item.category_name]
          );
          categoryId = catResult.rows[0]?.id ?? null;
        }

        const result = await client.query<{ id: number }>(
          `INSERT INTO doa_items (code, description, applies_to, category_id, business_owner, delegable, interpretation)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (code) DO UPDATE SET description = $2, applies_to = $3, category_id = $4,
             business_owner = $5, delegable = $6, interpretation = $7, updated_at = NOW()
           RETURNING id`,
          [
            item.code,
            item.description || null,
            item.applies_to || null,
            categoryId,
            item.business_owner || null,
            item.delegable || null,
            item.interpretation || null,
          ]
        );
        const newId = result.rows[0].id;

        // Replace approvers
        await client.query(`DELETE FROM doa_item_approvers WHERE doa_item_id = $1`, [newId]);
        if (item.approvers && Array.isArray(item.approvers)) {
          for (const approver of item.approvers) {
            const roleResult = await client.query<{ id: number }>(
              `SELECT id FROM roles WHERE name = $1`,
              [approver.role_name]
            );
            if (roleResult.rows[0]) {
              await client.query(
                `INSERT INTO doa_item_approvers (doa_item_id, role_id, action, sort_order)
                 VALUES ($1, $2, $3, $4)`,
                [newId, roleResult.rows[0].id, approver.action, approver.sort_order ?? 0]
              );
            }
          }
        }
        count++;
      }
      imported.doa_items = count;
    }

    // Import thresholds
    if (entities.thresholds) {
      const items = entities.thresholds as any[];
      if (mode === 'replace') {
        await client.query(`TRUNCATE thresholds CASCADE`);
      }
      let count = 0;
      for (const item of items) {
        const result = await client.query<{ id: number }>(
          `INSERT INTO thresholds (threshold_id, type, name, code, min_value, max_value,
             min_capex, max_capex, min_markup, max_markup, max_gross_margin,
             condition_text, notes, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (threshold_id) DO UPDATE SET type = $2, name = $3, code = $4,
             min_value = $5, max_value = $6, min_capex = $7, max_capex = $8,
             min_markup = $9, max_markup = $10, max_gross_margin = $11,
             condition_text = $12, notes = $13, sort_order = $14, updated_at = NOW()
           RETURNING id`,
          [
            item.threshold_id,
            item.type,
            item.name,
            item.code,
            item.min_value ?? null,
            item.max_value ?? null,
            item.min_capex ?? null,
            item.max_capex ?? null,
            item.min_markup ?? null,
            item.max_markup ?? null,
            item.max_gross_margin ?? null,
            item.condition_text ?? null,
            item.notes ?? null,
            item.sort_order ?? 0,
          ]
        );
        const newId = result.rows[0].id;

        // Replace approvers
        await client.query(`DELETE FROM threshold_approvers WHERE threshold_id = $1`, [newId]);
        if (item.approvers && Array.isArray(item.approvers)) {
          for (const approver of item.approvers) {
            const roleResult = await client.query<{ id: number }>(
              `SELECT id FROM roles WHERE name = $1`,
              [approver.role_name]
            );
            if (roleResult.rows[0]) {
              await client.query(
                `INSERT INTO threshold_approvers (threshold_id, role_id, action, label, sort_order)
                 VALUES ($1, $2, $3, $4, $5)`,
                [newId, roleResult.rows[0].id, approver.action, approver.label || '', approver.sort_order ?? 0]
              );
            }
          }
        }
        count++;
      }
      imported.thresholds = count;
    }

    // Import settings
    if (entities.settings) {
      const settings = entities.settings as any[];
      let count = 0;
      for (const s of settings) {
        await client.query(
          `INSERT INTO app_settings (key, value)
           VALUES ($1, $2::jsonb)
           ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
          [s.key, JSON.stringify(s.value)]
        );
        count++;
      }
      imported.settings = count;
    }

    await client.query('COMMIT');

    if (userId) {
      await writeAuditLog(userId, 'import', 'system', null, { mode }, imported);
    }

    return imported;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
