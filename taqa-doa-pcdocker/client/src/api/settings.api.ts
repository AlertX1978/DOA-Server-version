import apiClient from './client';
import type { Settings } from '../types';

export async function getSettings(): Promise<Settings> {
  const { data } = await apiClient.get<Settings>('/settings/aggregated');
  return data;
}
