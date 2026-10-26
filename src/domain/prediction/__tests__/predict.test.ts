import { addDays, asIsoDate, daysBetween, type IsoDate } from '@/domain/dates';

import { excludeOutliers, predictNextPeriod, stdDev, weightedMean } from '../predict';

const d = asIsoDate;

/** Build period starts from a first date and a list of cycle lengths. */
function startsFrom(first: string, lengths: number[]): IsoDate[] {
  const out = [d(first)];
  for (const len of lengths) out.push(addDays(out[out.length - 1]!, len));
  return out;
}

function expectRangeBracketsExpected(p: NonNullable<ReturnType<typeof predictNextPeriod>>) {
  expect(p.earliest <= p.expectedStart).toBe(true);
  expect(p.latest >= p.expectedStart).toBe(true);
  expect(daysBetween(p.earliest, p.latest)).toBeGreaterThanOrEqual(1);
  expect(p.halfWidth).toBeGreaterThanOrEqual(2);
}

describe('math helpers', () => {
  it('weightedMean favours recent values', () => {
    expect(weightedMean([20, 40])).toBeCloseTo((20 * 1 + 40 * 2) / 3);
    expect(weightedMean([])).toBe(0);
  });
  it('stdDev is sample SD', () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
    expect(stdDev([5])).toBe(0);
  });
  it('excludeOutliers drops implausible and >2SD values with enough data', () => {
    expect(excludeOutliers([28, 10, 95, 29])).toEqual([28, 29]);
    expect(excludeOutliers([28, 28, 28, 29, 28, 60])).toEqual([28, 28, 28, 29, 28]);
    expect(excludeOutliers([28, 60, 29])).toEqual([28, 60, 29]); // <4 values: keep
  });
});

describe('predictNextPeriod', () => {
  it('returns null with no period starts', () => {
    expect(predictNextPeriod({ periodStarts: [], today: d('2026-03-01') })).toBeNull();
  });

  it('uses the onboarding estimate when only one start exists', () => {
    const p = predictNextPeriod({
      periodStarts: [d('2026-03-01')],
      today: d('2026-03-05'),
      estimate: { cycleLength: 30, irregular: false },
    })!;
    expect(p.basis).toBe('estimate');
    expect(p.expectedStart).toBe('2026-03-31');
    expect(p.halfWidth).toBe(4);
    expect(p.confidence).toBe('low');
    expect(p.cyclesUsed).toBe(0);
    expectRangeBracketsExpected(p);
  });

  it('widens the estimate range when the user says cycles are irregular', () => {
    const p = predictNextPeriod({
      periodStarts: [d('2026-03-01')],
      today: d('2026-03-05'),
      estimate: { cycleLength: 30, irregular: true },
    })!;
    expect(p.halfWidth).toBe(7);
  });

  it('falls back to a 28-day default with low confidence and a wide range', () => {
    const p = predictNextPeriod({ periodStarts: [d('2026-03-01')], today: d('2026-03-05') })!;
    expect(p.basis).toBe('default');
    expect(p.expectedStart).toBe('2026-03-29');
    expect(p.halfWidth).toBe(7);
    expect(p.confidence).toBe('low');
  });

  it('blends one logged cycle with the estimate', () => {
    const p = predictNextPeriod({
      periodStarts: startsFrom('2026-01-01', [26]),
      today: d('2026-02-01'),
      estimate: { cycleLength: 30, irregular: false },
    })!;
    expect(p.basis).toBe('history');
    expect(p.cyclesUsed).toBe(1);
    expect(p.averageCycleLength).toBe(28);
    expect(p.confidence).toBe('low');
  });

  it('is confident and tight for regular cycles', () => {
    const starts = startsFrom('2025-09-01', [28, 29, 28, 28, 29, 28]);
    const p = predictNextPeriod({ periodStarts: starts, today: addDays(starts.at(-1)!, 3) })!;
    expect(p.confidence).toBe('high');
    expect(p.cyclesUsed).toBe(6);
    expect(p.halfWidth).toBe(2);
    expect(daysBetween(starts.at(-1)!, p.expectedStart)).toBe(28);
    expectRangeBracketsExpected(p);
  });

  it('widens the range and lowers confidence for highly irregular cycles', () => {
    const starts = startsFrom('2025-06-01', [21, 45, 30, 60, 25, 38]);
    const p = predictNextPeriod({ periodStarts: starts, today: addDays(starts.at(-1)!, 1) })!;
    expect(p.confidence).toBe('low');
    expect(p.halfWidth).toBeGreaterThanOrEqual(10);
    expect(p.variability).toBeGreaterThan(5);
    expectRangeBracketsExpected(p);
  });

  it('medium confidence for moderately variable cycles', () => {
    const starts = startsFrom('2025-09-01', [27, 31, 28, 33]);
    const p = predictNextPeriod({ periodStarts: starts, today: addDays(starts.at(-1)!, 1) })!;
    expect(p.confidence).toBe('medium');
    expect(p.halfWidth).toBeGreaterThanOrEqual(3);
  });

  it('excludes outliers from the average but counts them as history', () => {
    const starts = startsFrom('2025-08-01', [28, 28, 29, 95, 28, 28]);
    const p = predictNextPeriod({ periodStarts: starts, today: addDays(starts.at(-1)!, 1) })!;
    expect(p.cyclesUsed).toBe(5);
    expect(Math.round(p.averageCycleLength)).toBe(28);
    expect(p.confidence).toBe('high');
  });

  it('only uses the last 6 cycles', () => {
    const starts = startsFrom('2024-01-01', [40, 40, 40, 40, 28, 28, 28, 28, 28, 28]);
    const p = predictNextPeriod({ periodStarts: starts, today: addDays(starts.at(-1)!, 1) })!;
    expect(p.cyclesUsed).toBe(6);
    expect(Math.round(p.averageCycleLength)).toBe(28);
  });

  it('handles a very long gap honestly: overdue, range starts today', () => {
    const starts = startsFrom('2025-09-01', [28, 28, 28]);
    const today = addDays(starts.at(-1)!, 80);
    const p = predictNextPeriod({ periodStarts: starts, today })!;
    expect(p.isOverdue).toBe(true);
    expect(p.daysOverdue).toBeGreaterThan(40);
    expect(p.earliest).toBe(today);
    expect(p.latest).toBe(today);
    expect(p.expectedStart).toBe(today);
  });

  it('is not overdue while still inside the range', () => {
    const starts = startsFrom('2025-09-01', [28, 28, 28]);
    const p = predictNextPeriod({ periodStarts: starts, today: addDays(starts.at(-1)!, 29) })!;
    expect(p.isOverdue).toBe(false);
    expect(p.earliest < p.latest).toBe(true);
  });

  it('ignores future-dated starts', () => {
    const p = predictNextPeriod({
      periodStarts: [d('2026-03-01'), d('2026-06-01')],
      today: d('2026-03-10'),
      estimate: { cycleLength: 28, irregular: false },
    })!;
    expect(p.cyclesUsed).toBe(0);
    expect(p.expectedStart).toBe('2026-03-29');
  });

  it('counts calendar days across DST transitions (New York)', () => {
    expect(process.env.TZ).toBe('America/New_York');
    // Spring forward 2026-03-08, fall back 2026-11-01.
    const starts = [d('2026-02-08'), d('2026-03-08'), d('2026-04-05'), d('2026-05-03')];
    const p = predictNextPeriod({ periodStarts: starts, today: d('2026-05-04') })!;
    expect(p.cyclesUsed).toBe(3);
    expect(p.averageCycleLength).toBe(28);
    expect(p.expectedStart).toBe('2026-05-31');

    const autumn = [d('2026-10-04'), d('2026-11-01')];
    const q = predictNextPeriod({ periodStarts: autumn, today: d('2026-11-02') })!;
    expect(q.averageCycleLength).toBe(28);
    expect(q.expectedStart).toBe('2026-11-29');
  });
});
