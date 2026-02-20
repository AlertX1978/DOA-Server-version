import apiClient from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: number;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
  user_email?: string;
  user_display_name?: string;
}

export interface UserRecord {
  id: string;
  azure_oid: string;
  email: string;
  display_name: string;
  role: 'admin' | 'viewer';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface ThresholdApprover {
  role: string;
  action: string;
  label: string;
}

export interface ThresholdRecord {
  id: number;
  threshold_id: string;
  type: string;
  name: string;
  code: string;
  min_value: number | null;
  max_value: number | null;
  notes: string | null;
  sort_order: number;
  approvers: ThresholdApprover[];
}

export interface RoleRecord {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CountryRecord {
  id: number;
  name: string;
  risk_level: string;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export async function getAuditLog(params?: {
  limit?: number;
  offset?: number;
  entity_type?: string;
}): Promise<{ rows: AuditLogEntry[]; total: number }> {
  const { data } = await apiClient.get<{ rows: AuditLogEntry[]; total: number }>(
    '/admin/audit-log',
    { params },
  );
  return data;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUsers(): Promise<UserRecord[]> {
  const { data } = await apiClient.get<UserRecord[]>('/admin/users');
  return data;
}

export async function updateUserRole(id: string, role: string): Promise<UserRecord> {
  const { data } = await apiClient.put<UserRecord>(
    `/admin/users/${id}/role`,
    { role },
  );
  return data;
}

export async function toggleUserActive(id: string, isActive: boolean): Promise<UserRecord> {
  const { data } = await apiClient.put<UserRecord>(
    `/admin/users/${id}/active`,
    { is_active: isActive },
  );
  return data;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

export async function getThresholds(): Promise<ThresholdRecord[]> {
  const { data } = await apiClient.get<ThresholdRecord[]>('/admin/thresholds');
  return data;
}

export async function updateThreshold(
  thresholdId: string,
  payload: Partial<ThresholdRecord>,
): Promise<ThresholdRecord> {
  const { data } = await apiClient.put<ThresholdRecord>(
    `/admin/thresholds/${thresholdId}`,
    payload,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export async function getRoles(): Promise<RoleRecord[]> {
  const { data } = await apiClient.get<RoleRecord[]>('/admin/roles');
  return data;
}

export async function createRole(payload: { name: string; sort_order?: number }): Promise<RoleRecord> {
  const { data } = await apiClient.post<RoleRecord>(
    '/admin/roles',
    payload,
  );
  return data;
}

export async function updateRole(id: number, payload: Partial<RoleRecord>): Promise<RoleRecord> {
  const { data } = await apiClient.put<RoleRecord>(
    `/admin/roles/${id}`,
    payload,
  );
  return data;
}

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

export async function getCountries(): Promise<CountryRecord[]> {
  const { data } = await apiClient.get<CountryRecord[]>('/admin/countries');
  return data;
}

export async function addCountry(name: string, riskLevel: string): Promise<CountryRecord> {
  const { data } = await apiClient.post<CountryRecord>(
    '/admin/countries',
    { name, risk_level: riskLevel },
  );
  return data;
}

export async function deleteCountry(id: number): Promise<void> {
  await apiClient.delete(`/admin/countries/${id}`);
}

export async function updateCountryRisk(id: number, riskLevel: string): Promise<CountryRecord> {
  const { data } = await apiClient.put<CountryRecord>(
    `/admin/countries/${id}`,
    { risk_level: riskLevel },
  );
  return data;
}
