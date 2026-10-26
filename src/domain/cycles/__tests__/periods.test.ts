import type { PeriodDay } from '@/db/repositories/periodDaysRepo';
import { asIsoDate } from '@/domain/dates';

import { currentCycle, cycleLengths, derivePeriods, periodStarts } from '../periods';

const d = asIsoDate;
const pd = (date: string, flow: PeriodDay['flow'] = 'medium'): PeriodDay => ({
  date: d(date),
  flow,
});

describe('derivePeriods', () => {
  it('returns nothing for no days', () => {
    expect(derivePeriods([])).toEqual([]);
  });

  it('groups consecutive days and tolerates a 1-day gap', () => {
    const periods = derivePeriods([
      pd('2026-03-03'),
      pd('2026-03-01'),
      pd('2026-03-02', 'heavy'),
      pd('2026-03-05', 'light'), // gap of one skipped day (03-04)
      pd('2026-03-30'),
    ]);
    expect(periods.map((p) => [p.start, p.end, p.length])).toEqual([
      ['2026-03-01', '2026-03-05', 5],
      ['2026-03-30', '2026-03-30', 1],
    ]);
  });

  it('ignores spotting-only runs but keeps spotting at period edges', () => {
    const periods = derivePeriods([
      pd('2026-03-01', 'spotting'),
      pd('2026-03-02', 'medium'),
      pd('2026-03-03', 'spotting'),
      pd('2026-03-15', 'spotting'), // mid-cycle spotting, not a period
    ]);
    expect(periods).toHaveLength(1);
    expect(periods[0]?.start).toBe('2026-03-01');
    expect(periods[0]?.end).toBe('2026-03-03');
  });
});

describe('cycle helpers', () => {
  const starts = [d('2026-01-01'), d('2026-01-29'), d('2026-02-28')];
  it('computes lengths between starts', () => {
    expect(cycleLengths(starts)).toEqual([28, 30]);
    expect(cycleLengths([])).toEqual([]);
  });
  it('reports the current cycle day', () => {
    expect(currentCycle(starts, d('2026-02-28'))).toEqual({ start: '2026-02-28', day: 1 });
    expect(currentCycle(starts, d('2026-03-10'))).toEqual({ start: '2026-02-28', day: 11 });
    expect(currentCycle(starts, d('2025-12-01'))).toBeNull();
    expect(periodStarts(derivePeriods([pd('2026-05-05')]))).toEqual(['2026-05-05']);
  });
});
