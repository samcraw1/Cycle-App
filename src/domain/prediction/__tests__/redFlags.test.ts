import { addDays, asIsoDate, type IsoDate } from '@/domain/dates';

import { detectRedFlags } from '../redFlags';

const d = asIsoDate;
function startsFrom(first: string, lengths: number[]): IsoDate[] {
  const out = [d(first)];
  for (const len of lengths) out.push(addDays(out[out.length - 1]!, len));
  return out;
}

describe('detectRedFlags', () => {
  it('is quiet for regular cycles and no data', () => {
    expect(detectRedFlags([], d('2026-03-01'))).toEqual([]);
    const s = startsFrom('2025-10-01', [28, 29, 28, 30]);
    expect(detectRedFlags(s, addDays(s.at(-1)!, 10))).toEqual([]);
  });
  it('flags 90+ days without a period', () => {
    expect(detectRedFlags([d('2025-11-01')], d('2026-01-30'))).toEqual(['no_period_90_days']);
    expect(detectRedFlags([d('2025-11-01')], d('2026-01-29'))).toEqual([]);
  });
  it('flags only sustained short or long patterns', () => {
    const short = startsFrom('2026-01-01', [19, 20, 18, 28]);
    expect(detectRedFlags(short, addDays(short.at(-1)!, 1))).toEqual(['consistently_short']);
    const long = startsFrom('2025-06-01', [50, 48, 30, 52]);
    expect(detectRedFlags(long, addDays(long.at(-1)!, 1))).toEqual(['consistently_long']);
    const oneOff = startsFrom('2025-09-01', [28, 60, 28, 28]);
    expect(detectRedFlags(oneOff, addDays(oneOff.at(-1)!, 1))).toEqual([]);
  });
});
