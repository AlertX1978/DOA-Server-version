import apiClient from './client';
import type { DOAItem, DOAItemApprover } from '../types';

export async function getDOAItems(params?: { category_id?: number; search?: string }): Promise<DOAItem[]> {
  const { data } = await apiClient.get<DOAItem[]>('/admin/doa-items', { params });
  return data;
}

export async function getDOAItem(id: number): Promise<DOAItem> {
  const { data } = await apiClient.get<DOAItem>(`/admin/doa-items/${id}`);
  return data;
}

export async function createDOAItem(item: {
  code: string; description?: string | null; applies_to?: string | null;
  category_id?: number | null; business_owner?: string | null;
  delegable?: string | null; interpretation?: string | null;
}): Promise<DOAItem> {
  const { data } = await apiClient.post<DOAItem>('/admin/doa-items', item);
  return data;
}

export async function updateDOAItem(id: number, item: Partial<{
  code: string; description: string | null; applies_to: string | null;
  category_id: number | null; business_owner: string | null;
  delegable: string | null; interpretation: string | null;
}>): Promise<DOAItem> {
  const { data } = await apiClient.put<DOAItem>(`/admin/doa-items/${id}`, item);
  return data;
}

export async function deleteDOAItem(id: number): Promise<void> {
  await apiClient.delete(`/admin/doa-items/${id}`);
}

export async function replaceDOAItemApprovers(
  id: number, approvers: Array<{ role_id: number; action: string; sort_order: number }>
): Promise<DOAItemApprover[]> {
  const { data } = await apiClient.put<DOAItemApprover[]>(`/admin/doa-items/${id}/approvers`, { approvers });
  return data;
}
