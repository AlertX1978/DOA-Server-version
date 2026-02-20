import apiClient from './client';
import type { BrowseItem } from '../types';

export async function getBrowseItems(params?: { search?: string; function?: string }): Promise<BrowseItem[]> {
  const { data } = await apiClient.get<BrowseItem[]>('/browse/items', { params });
  return data;
}

export async function getBrowseFunctions(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/browse/functions');
  return data;
}
