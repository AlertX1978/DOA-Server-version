import apiClient from './client';
import type { BrowseItem, ApproverEntry } from '../types';

export async function getBrowseItems(params?: { search?: string; function?: string }): Promise<BrowseItem[]> {
  const { data } = await apiClient.get<BrowseItem[]>('/admin/browse-items', { params });
  return data;
}

export async function getBrowseItem(id: number): Promise<BrowseItem> {
  const { data } = await apiClient.get<BrowseItem>(`/admin/browse-items/${id}`);
  return data;
}

export async function createBrowseItem(item: {
  code: string; parent_code?: string | null; title: string;
  description?: string | null; comments?: string | null;
  function_name?: string | null; sort_order?: number;
}): Promise<BrowseItem> {
  const { data } = await apiClient.post<BrowseItem>('/admin/browse-items', item);
  return data;
}

export async function updateBrowseItem(id: number, item: Partial<{
  code: string; parent_code: string | null; title: string;
  description: string | null; comments: string | null;
  function_name: string | null; sort_order: number;
}>): Promise<BrowseItem> {
  const { data } = await apiClient.put<BrowseItem>(`/admin/browse-items/${id}`, item);
  return data;
}

export async function deleteBrowseItem(id: number, cascade = false): Promise<void> {
  await apiClient.delete(`/admin/browse-items/${id}${cascade ? '?cascade=true' : ''}`);
}

export async function reorderBrowseItems(items: Array<{ id: number; sort_order: number }>): Promise<void> {
  await apiClient.post('/admin/browse-items/reorder', { items });
}

export async function replaceBrowseItemApprovers(
  id: number, approvers: Array<{ role_id: number; action: string; kind: string; sort_order: number }>
): Promise<ApproverEntry[]> {
  const { data } = await apiClient.put<ApproverEntry[]>(`/admin/browse-items/${id}/approvers`, { approvers });
  return data;
}
