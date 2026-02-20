import apiClient from './client';
import type { GlossaryEntry } from '../types';

export async function getGlossary(): Promise<GlossaryEntry[]> {
  const { data } = await apiClient.get<GlossaryEntry[]>('/glossary');
  return data;
}
