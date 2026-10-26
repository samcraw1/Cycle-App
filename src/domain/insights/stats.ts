import { cycleLengths, type Period } from '@/domain/cycles';
import type { IsoDate } from '@/domain/dates';
import { mean, stdDev } from '@/domain/prediction';

export interface CycleRecord {
  start: IsoDate;
  length: number;
}

export interface CycleStats {
  /** Completed cycles, oldest first. */
  cycles: CycleRecord[];
  count: number;
  average: number | null;
  /** Sample standard deviation; null with fewer than 2 cycles. */
  variability: number | null;
  shortest: number | null;
  longest: number | null;
  averagePeriodLength: number | null;
}

export type VariabilityLabel = 'very_regular' | 'fairly_regular' | 'variable' | 'highly_variable';

export function variabilityLabel(sd: number | null): VariabilityLabel | null {
  if (sd === null) return null;
  if (sd <= 2) return 'very_regular';
  if (sd <= 4) return 'fairly_regular';
  if (sd <= 8) return 'variable';
  return 'highly_variable';
}

export const VARIABILITY_COPY: Record<VariabilityLabel, string> = {
  very_regular: 'Very regular',
  fairly_regular: 'Fairly regular',
  variable: 'Variable',
  highly_variable: 'Highly variable',
};

export function cycleStats(periods: readonly Period[]): CycleStats {
  const starts = periods.map((p) => p.start);
  const lengths = cycleLengths(starts);
  const cycles = lengths.map((length, i) => ({ start: starts[i]!, length }));
  const periodLengths = periods.map((p) => p.length);
  return {
    cycles,
    count: cycles.length,
    average: lengths.length ? Math.round(mean(lengths) * 10) / 10 : null,
    variability: lengths.length >= 2 ? Math.round(stdDev(lengths) * 10) / 10 : null,
    shortest: lengths.length ? Math.min(...lengths) : null,
    longest: lengths.length ? Math.max(...lengths) : null,
    averagePeriodLength: periodLengths.length ? Math.round(mean(periodLengths) * 10) / 10 : null,
  };
}
