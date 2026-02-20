import apiClient from './client';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'viewer';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/auth/me');
  return data;
}

export async function getRole(): Promise<{ role: string }> {
  const { data } = await apiClient.get<{ role: string }>('/auth/role');
  return data;
}
