import type { DayLog, PeriodDay } from '@/db';
import { derivePeriods } from '@/domain/cycles';
import { addDays, asIsoDate, dateRange } from '@/domain/dates';

import { cycleStats, phaseForDay, symptomsByPhase, topSymptoms, variabilityLabel } from '../index';

const d = asIsoDate;

function periodDays(start: string, length: number): PeriodDay[] {
  return dateRange(d(start), addDays(d(start), length - 1)).map((date) => ({
    date,
    flow: 'medium' as const,
  }));
}
const log = (date: string, symptomIds: string[]): DayLog => ({
  date: d(date),
  mood: null,
  notes: null,
  symptomIds,
});

describe('cycleStats', () => {
  it('handles no periods and a single period', () => {
    expect(cycleStats([])).toMatchObject({
      count: 0,
      average: null,
      variability: null,
      averagePeriodLength: null,
    });
    const one = cycleStats(derivePeriods(periodDays('2026-01-01', 5)));
    expect(one).toMatchObject({ count: 0, average: null, averagePeriodLength: 5 });
  });
  it('computes lengths, average, variability, min, max', () => {
    const periods = derivePeriods([
      ...periodDays('2026-01-01', 5),
      ...periodDays('2026-01-29', 4),
      ...periodDays('2026-02-28', 6),
    ]);
    const s = cycleStats(periods);
    expect(s.cycles).toEqual([
      { start: '2026-01-01', length: 28 },
      { start: '2026-01-29', length: 30 },
    ]);
    expect(s.average).toBe(29);
    expect(s.variability).toBe(1.4);
    expect(s.shortest).toBe(28);
    expect(s.longest).toBe(30);
    expect(s.averagePeriodLength).toBe(5);
  });
  it('labels variability', () => {
    expect(variabilityLabel(null)).toBeNull();
    expect(variabilityLabel(1.5)).toBe('very_regular');
    expect(variabilityLabel(3)).toBe('fairly_regular');
    expect(variabilityLabel(6)).toBe('variable');
    expect(variabilityLabel(12)).toBe('highly_variable');
  });
});

describe('phaseForDay', () => {
  const period = derivePeriods(periodDays('2026-03-01', 5))[0]!;
  it('maps a 28-day cycle to phases', () => {
    expect(phaseForDay(d('2026-03-01'), period, 28)).toBe('menstrual');
    expect(phaseForDay(d('2026-03-05'), period, 28)).toBe('menstrual');
    expect(phaseForDay(d('2026-03-08'), period, 28)).toBe('follicular');
    expect(phaseForDay(d('2026-03-14'), period, 28)).toBe('ovulatory'); // day 14
    expect(phaseForDay(d('2026-03-16'), period, 28)).toBe('ovulatory'); // day 16
    expect(phaseForDay(d('2026-03-17'), period, 28)).toBe('luteal');
    expect(phaseForDay(d('2026-03-28'), period, 28)).toBe('luteal');
  });
  it('returns null outside the cycle and shifts ovulation for long cycles', () => {
    expect(phaseForDay(d('2026-02-28'), period, 28)).toBeNull();
    expect(phaseForDay(d('2026-03-29'), period, 28)).toBeNull();
    expect(phaseForDay(d('2026-03-14'), period, 45)).toBe('follicular');
    expect(phaseForDay(d('2026-03-31'), period, 45)).toBe('ovulatory'); // day 31 of 45
  });
});

describe('symptomsByPhase', () => {
  it('buckets symptoms by estimated phase and ranks them', () => {
    const periods = derivePeriods([...periodDays('2026-03-01', 5), ...periodDays('2026-03-29', 5)]);
    const logs = [
      log('2026-02-20', ['acne']), // before first period: ignored
      log('2026-03-02', ['cramps', 'fatigue']),
      log('2026-03-03', ['cramps']),
      log('2026-03-15', ['ovulation_pain']),
      log('2026-03-25', ['bloating', 'low_mood']),
      log('2026-03-27', ['bloating']),
      log('2026-03-30', ['cramps']),
      log('2026-04-10', []), // no symptoms: not counted
    ];
    const out = symptomsByPhase(logs, periods, 28);
    const by = Object.fromEntries(out.map((o) => [o.phase, o]));
    expect(by.menstrual).toMatchObject({ loggedDays: 3 });
    expect(by.menstrual?.top[0]).toEqual({ symptomId: 'cramps', count: 3, share: 1 });
    expect(by.ovulatory?.top[0]?.symptomId).toBe('ovulation_pain');
    expect(by.luteal?.top.map((t) => t.symptomId)).toEqual(['bloating', 'low_mood']);
    expect(by.luteal?.top[0]?.share).toBe(1);
    expect(by.follicular?.loggedDays).toBe(0);
  });
  it('uses the expected length for the open cycle', () => {
    const periods = derivePeriods(periodDays('2026-03-01', 5));
    const out = symptomsByPhase([log('2026-03-31', ['bloating'])], periods, 35);
    expect(out.find((o) => o.phase === 'luteal')?.loggedDays).toBe(1);
    const tooFar = symptomsByPhase([log('2026-04-20', ['bloating'])], periods, 35);
    expect(tooFar.every((o) => o.loggedDays === 0)).toBe(true);
  });
});

describe('topSymptoms', () => {
  it('counts across all logs', () => {
    expect(topSymptoms([log('2026-01-01', ['a', 'b']), log('2026-01-02', ['b'])], 1)).toEqual([
      { symptomId: 'b', count: 2 },
    ]);
  });
});
