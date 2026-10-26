import type { Flow, PeriodDay } from '@/db/repositories/periodDaysRepo';
import { daysBetween, type IsoDate } from '@/domain/dates';

export interface Period {
  start: IsoDate;
  end: IsoDate;
  /** Calendar days from start to end inclusive. */
  length: number;
  days: PeriodDay[];
}

/** Two logged days this far apart (or closer) belong to the same period. */
export const MAX_GAP_DAYS = 2;

const isBleeding = (flow: Flow) => flow !== 'spotting';

/**
 * Groups logged period days into periods. A run made only of spotting is not
 * a period (mid-cycle spotting must not create a false cycle start) but
 * spotting at the edges of a real period is included in it.
 */
export function derivePeriods(days: readonly PeriodDay[]): Period[] {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const runs: PeriodDay[][] = [];
  for (const day of sorted) {
    const current = runs[runs.length - 1];
    const last = current?.[current.length - 1];
    if (current && last && daysBetween(last.date, day.date) <= MAX_GAP_DAYS) current.push(day);
    else runs.push([day]);
  }
  return runs
    .filter((run) => run.some((d) => isBleeding(d.flow)))
    .map((run) => {
      const first = run[0]!;
      const last = run[run.length - 1]!;
      return {
        start: first.date,
        end: last.date,
        length: daysBetween(first.date, last.date) + 1,
        days: run,
      };
    });
}

export function periodStarts(periods: readonly Period[]): IsoDate[] {
  return periods.map((p) => p.start);
}

/** Lengths between consecutive period starts, oldest first. */
export function cycleLengths(starts: readonly IsoDate[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < starts.length; i += 1) out.push(daysBetween(starts[i - 1]!, starts[i]!));
  return out;
}

export interface CurrentCycle {
  start: IsoDate;
  /** 1-based day of cycle for `today`. */
  day: number;
}

export function currentCycle(starts: readonly IsoDate[], today: IsoDate): CurrentCycle | null {
  const past = starts.filter((s) => s <= today);
  const start = past[past.length - 1];
  if (!start) return null;
  return { start, day: daysBetween(start, today) + 1 };
}
