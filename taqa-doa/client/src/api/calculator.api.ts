import apiClient from './client';
import type { CalculatorInput, CalculatorResult, Country } from '../types';

export async function evaluateCalculator(input: CalculatorInput): Promise<CalculatorResult> {
  const { data } = await apiClient.post<CalculatorResult>('/calculator/evaluate', input);
  return data;
}

export async function getCountries(): Promise<Country[]> {
  const { data } = await apiClient.get<Country[]>('/calculator/countries');
  return data;
}
