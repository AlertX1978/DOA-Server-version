import { query } from '../config/database';
import type { User, UserRole } from '../models/types';
import { env } from '../config/environment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UpsertUserInput {
  azureOid: string;
  email: string;
  displayName: string;
}

interface UserRow {
  id: string;
  azure_oid: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Find or create user on first login (auto-provision)
// ---------------------------------------------------------------------------

/**
 * Called on every authenticated API request (via /api/v1/auth/me).
 *
 * - If the user already exists (by azure_oid), updates last_login_at
 *   and returns the existing record.
 * - If the user does not exist, creates a new record with 'viewer' role
 *   (or 'admin' if their email matches ADMIN_SEED_EMAIL).
 */
export async function findOrCreateUser(input: UpsertUserInput): Promise<UserRow> {
  // Try to find existing user by Azure OID
  const existing = await query<UserRow>(
    `SELECT * FROM users WHERE azure_oid = $1`,
    [input.azureOid],
  );

  if (existing.rows.length > 0) {
    // Update last_login_at and email/display_name (in case they changed in AAD)
    const updated = await query<UserRow>(
      `UPDATE users
       SET last_login_at = NOW(),
           email = $2,
           display_name = $3
       WHERE azure_oid = $1
       RETURNING *`,
      [input.azureOid, input.email, input.displayName],
    );
    return updated.rows[0];
  }

  // New user — determine role
  const role: UserRole =
    env.ADMIN_SEED_EMAIL && input.email.toLowerCase() === env.ADMIN_SEED_EMAIL.toLowerCase()
      ? 'admin'
      : 'viewer';

  const created = await query<UserRow>(
    `INSERT INTO users (azure_oid, email, display_name, role, last_login_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [input.azureOid, input.email, input.displayName, role],
  );

  console.log(`[user] Auto-provisioned new user: ${input.email} (role: ${role})`);

  return created.rows[0];
}

// ---------------------------------------------------------------------------
// Get user by ID
// ---------------------------------------------------------------------------

export async function getUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

// ---------------------------------------------------------------------------
// Get user by Azure OID
// ---------------------------------------------------------------------------

export async function getUserByOid(oid: string): Promise<UserRow | null> {
  const result = await query<UserRow>(`SELECT * FROM users WHERE azure_oid = $1`, [oid]);
  return result.rows[0] || null;
}

// ---------------------------------------------------------------------------
// List all users (admin only)
// ---------------------------------------------------------------------------

export async function listUsers(): Promise<UserRow[]> {
  const result = await query<UserRow>(
    `SELECT * FROM users ORDER BY created_at DESC`,
  );
  return result.rows;
}

// ---------------------------------------------------------------------------
// Update user role (admin only)
// ---------------------------------------------------------------------------

export async function updateUserRole(id: string, role: UserRole): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET role = $2 WHERE id = $1 RETURNING *`,
    [id, role],
  );
  return result.rows[0] || null;
}

// ---------------------------------------------------------------------------
// Toggle user active status (admin only)
// ---------------------------------------------------------------------------

export async function toggleUserActive(id: string, isActive: boolean): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET is_active = $2 WHERE id = $1 RETURNING *`,
    [id, isActive],
  );
  return result.rows[0] || null;
}
