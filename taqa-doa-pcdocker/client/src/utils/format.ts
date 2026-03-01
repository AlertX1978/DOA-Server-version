export function formatCurrency(value: number): string {
  if (value >= 1000000) return `SAR ${(value / 1000000).toFixed(1)}M`;
  return `SAR ${value.toLocaleString()}`;
}
