import { Parcel } from './parcel';
export type RatioBucket = 'low' | 'midLow' | 'mid' | 'midHigh' | 'high' | 'none';

export const ratio = (p: Parcel): number | null => {
  return p.lastSalePrice != null ? p.assessedValue / p.lastSalePrice : null;
};

export const median = (xs: number[]): number => {
  const s = xs.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export const cod = (ratios: number[], med: number): number =>
  (100 * (ratios.reduce((acc, r) => acc + Math.abs(r - med), 0) / ratios.length)) / med;

export const ratioBucket = (r: number | null): RatioBucket => {
  if (r == null) return 'none';
  if (r < 0.9) return 'low';
  if (r < 0.96) return 'midLow';
  if (r < 1.04) return 'mid';
  if (r < 1.1) return 'midHigh';
  return 'high';
};
