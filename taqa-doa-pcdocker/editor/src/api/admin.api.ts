import apiClient from './client';
import type { Role, Category, Country, Threshold, GlossaryEntry, AppSetting, AuditLogEntry, ThresholdApprover } from '../types';

// Roles
export async function getRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<Role[]>('/admin/roles');
  return data;
}
export async function createRole(role: { name: string; sort_order?: number }): Promise<Role> {
  const { data } = await apiClient.post<Role>('/admin/roles', role);
  return data;
}
export async function updateRole(id: number, role: Partial<{ name: string; sort_order: number; is_active: boolean }>): Promise<Role> {
  const { data } = await apiClient.put<Role>(`/admin/roles/${id}`, role);
  return data;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/admin/categories');
  return data;
}
export async function createCategory(cat: { name: string; sort_order?: number }): Promise<Category> {
  const { data } = await apiClient.post<Category>('/admin/categories', cat);
  return data;
}
export async function updateCategory(id: number, cat: Partial<{ name: string; sort_order: number }>): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/admin/categories/${id}`, cat);
  return data;
}
export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/admin/categories/${id}`);
}

// Countries
export async function getCountries(): Promise<Country[]> {
  const { data } = await apiClient.get<Country[]>('/admin/countries');
  return data;
}
export async function createCountry(c: { name: string; risk_level: string }): Promise<Country> {
  const { data } = await apiClient.post<Country>('/admin/countries', c);
  return data;
}
export async function updateCountry(id: number, c: { risk_level: string }): Promise<Country> {
  const { data } = await apiClient.put<Country>(`/admin/countries/${id}`, c);
  return data;
}
export async function deleteCountry(id: number): Promise<void> {
  await apiClient.delete(`/admin/countries/${id}`);
}

// Thresholds
export async function getThresholds(): Promise<Threshold[]> {
  const { data } = await apiClient.get<Threshold[]>('/admin/thresholds');
  return data;
}
export async function createThreshold(t: Record<string, unknown>): Promise<Threshold> {
  const { data } = await apiClient.post<Threshold>('/admin/thresholds', t);
  return data;
}
export async function updateThreshold(id: number, t: Record<string, unknown>): Promise<Threshold> {
  const { data } = await apiClient.put<Threshold>(`/admin/thresholds/${id}`, t);
  return data;
}
export async function deleteThreshold(id: number): Promise<void> {
  await apiClient.delete(`/admin/thresholds/${id}`);
}
export async function replaceThresholdApprovers(
  id: number, approvers: Array<{ role_id: number; action: string; label: string; sort_order: number }>
): Promise<ThresholdApprover[]> {
  const { data } = await apiClient.put<ThresholdApprover[]>(`/admin/thresholds/${id}/approvers`, { approvers });
  return data;
}

// Glossary
export async function getGlossary(): Promise<GlossaryEntry[]> {
  const { data } = await apiClient.get<GlossaryEntry[]>('/admin/glossary');
  return data;
}
export async function createGlossaryEntry(g: { code: string; name: string; description?: string | null; sort_order?: number }): Promise<GlossaryEntry> {
  const { data } = await apiClient.post<GlossaryEntry>('/admin/glossary', g);
  return data;
}
export async function updateGlossaryEntry(id: number, g: Partial<{ code: string; name: string; description: string | null; sort_order: number }>): Promise<GlossaryEntry> {
  const { data } = await apiClient.put<GlossaryEntry>(`/admin/glossary/${id}`, g);
  return data;
}
export async function deleteGlossaryEntry(id: number): Promise<void> {
  await apiClient.delete(`/admin/glossary/${id}`);
}

// Settings
export async function getSettings(): Promise<AppSetting[]> {
  const { data } = await apiClient.get<AppSetting[]>('/settings');
  return data;
}
export async function updateSetting(key: string, value: unknown): Promise<void> {
  await apiClient.put(`/settings/${key}`, { value });
}

// Audit Log
export async function getAuditLog(params?: {
  limit?: number; offset?: number; entity_type?: string; action?: string;
}): Promise<{ rows: AuditLogEntry[]; total: number }> {
  const { data } = await apiClient.get<{ rows: AuditLogEntry[]; total: number }>('/admin/audit-log', { params });
  return data;
}

// Import/Export
export async function exportData(entities?: string[]): Promise<Record<string, unknown>> {
  const params = entities ? { entities: entities.join(',') } : undefined;
  const { data } = await apiClient.get<Record<string, unknown>>('/admin/import-export/export', { params });
  return data;
}
export async function validateImport(importData: Record<string, unknown>): Promise<{ valid: boolean; errors: string[]; warnings: string[]; counts: Record<string, number> }> {
  const { data } = await apiClient.post<{ valid: boolean; errors: string[]; warnings: string[]; counts: Record<string, number> }>('/admin/import-export/import/validate', importData);
  return data;
}
export async function importData(importData: Record<string, unknown>): Promise<{ imported: Record<string, number> }> {
  const { data } = await apiClient.post<{ imported: Record<string, number> }>('/admin/import-export/import', importData);
  return data;
}
