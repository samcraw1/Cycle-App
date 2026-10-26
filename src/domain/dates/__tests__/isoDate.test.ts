import {
  addDays,
  asIsoDate,
  compareIsoDate,
  dateRange,
  daysBetween,
  fromIsoDate,
  isIsoDate,
  sortIsoDates,
  toIsoDate,
  today,
} from '../isoDate';

const d = asIsoDate;

describe('isIsoDate', () => {
  it('accepts valid calendar dates', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true);
  });
  it('rejects malformed or impossible dates', () => {
    expect(isIsoDate('2026-2-8')).toBe(false);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-02-28T00:00:00Z')).toBe(false);
    expect(isIsoDate(20260228)).toBe(false);
  });
  it('asIsoDate throws on bad input', () => {
    expect(() => asIsoDate('nope')).toThrow(/Invalid calendar date/);
  });
});

describe('toIsoDate / today', () => {
  it('uses the local calendar day, not UTC', () => {
    expect(process.env.TZ).toBe('America/New_York');
    // 23:30 local on Mar 9 is 03:30 UTC Mar 10. Must stay Mar 9.
    const lateEvening = new Date(2026, 2, 9, 23, 30);
    expect(toIsoDate(lateEvening)).toBe('2026-03-09');
    expect(today(lateEvening)).toBe('2026-03-09');
  });
});

describe('addDays / daysBetween across DST', () => {
  it('spring forward (2026-03-08 in New York) is still one calendar day', () => {
    expect(addDays(d('2026-03-07'), 1)).toBe('2026-03-08');
    expect(addDays(d('2026-03-07'), 2)).toBe('2026-03-09');
    expect(daysBetween(d('2026-03-07'), d('2026-03-09'))).toBe(2);
  });
  it('fall back (2026-11-01 in New York) is still one calendar day', () => {
    expect(addDays(d('2026-10-31'), 1)).toBe('2026-11-01');
    expect(daysBetween(d('2026-10-31'), d('2026-11-02'))).toBe(2);
  });
  it('handles negative and zero offsets', () => {
    expect(addDays(d('2026-01-01'), -1)).toBe('2025-12-31');
    expect(daysBetween(d('2026-05-05'), d('2026-05-05'))).toBe(0);
    expect(daysBetween(d('2026-05-10'), d('2026-05-05'))).toBe(-5);
  });
  it('fromIsoDate returns local midnight', () => {
    const dt = fromIsoDate(d('2026-03-08'));
    expect(dt.getHours()).toBe(0);
    expect(dt.getDate()).toBe(8);
  });
});

describe('ordering helpers', () => {
  it('compares and sorts lexicographically', () => {
    expect(compareIsoDate(d('2026-01-02'), d('2026-01-10'))).toBe(-1);
    expect(sortIsoDates([d('2026-03-01'), d('2025-12-31'), d('2026-01-15')])).toEqual([
      '2025-12-31',
      '2026-01-15',
      '2026-03-01',
    ]);
  });
  it('dateRange is inclusive', () => {
    expect(dateRange(d('2026-02-27'), d('2026-03-02'))).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
    expect(dateRange(d('2026-02-27'), d('2026-02-27'))).toEqual(['2026-02-27']);
  });
});
