import { daysBetween, type IsoDate } from '@/domain/dates';

export type RedFlag = 'no_period_90_days' | 'consistently_short' | 'consistently_long';

export const SHORT_CYCLE_DAYS = 21;
export const LONG_CYCLE_DAYS = 45;
export const NO_PERIOD_DAYS = 90;

/**
 * Neutral "consider talking to a doctor" nudges. Only fires on sustained
 * patterns (3 of the last 4 cycles) or a 90+ day gap, never on a single cycle.
 */
export function detectRedFlags(periodStarts: readonly IsoDate[], today: IsoDate): RedFlag[] {
  const starts = [...periodStarts].filter((s) => s <= today).sort();
  const flags: RedFlag[] = [];
  const last = starts[starts.length - 1];
  if (last && daysBetween(last, today) >= NO_PERIOD_DAYS) flags.push('no_period_90_days');

  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i += 1) lengths.push(daysBetween(starts[i - 1]!, starts[i]!));
  const recent = lengths.slice(-4);
  if (recent.length >= 3) {
    const short = recent.filter((l) => l < SHORT_CYCLE_DAYS).length;
    const long = recent.filter((l) => l > LONG_CYCLE_DAYS).length;
    if (short >= 3) flags.push('consistently_short');
    if (long >= 3) flags.push('consistently_long');
  }
  return flags;
}

export const RED_FLAG_COPY: Record<RedFlag, string> = {
  no_period_90_days:
    "It's been over 90 days since your last logged period. If that's unexpected, it may be worth mentioning to a doctor.",
  consistently_short:
    'Your recent cycles have been shorter than 21 days. That can be normal, but a doctor can help you understand it.',
  consistently_long:
    'Your recent cycles have been longer than 45 days. That can be normal, but a doctor can help you understand it.',
};
