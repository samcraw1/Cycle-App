import type { PeriodDay, SettingsSchema } from '@/db';
import { currentCycle, derivePeriods, periodStarts, type Period } from '@/domain/cycles';
import type { IsoDate } from '@/domain/dates';
import {
  detectRedFlags,
  predictNextPeriod,
  type Prediction,
  type RedFlag,
} from '@/domain/prediction';

export interface CycleSummary {
  periods: Period[];
  starts: IsoDate[];
  current: ReturnType<typeof currentCycle>;
  prediction: Prediction | null;
  redFlags: RedFlag[];
}

/** Pure derivation from raw state; memoize at the call site. */
export function summarizeCycles(
  periodDays: readonly PeriodDay[],
  settings: Pick<SettingsSchema, 'estimated_cycle_length' | 'cycles_irregular'>,
  today: IsoDate,
): CycleSummary {
  const periods = derivePeriods(periodDays);
  const starts = periodStarts(periods);
  return {
    periods,
    starts,
    current: currentCycle(starts, today),
    prediction: predictNextPeriod({
      periodStarts: starts,
      today,
      estimate: {
        cycleLength: settings.estimated_cycle_length,
        irregular: settings.cycles_irregular,
      },
    }),
    redFlags: detectRedFlags(starts, today),
  };
}
