import type { SettingsSchema } from '@/db';
import { addDays, type IsoDate } from '@/domain/dates';
import type { Prediction } from '@/domain/prediction';

export type ReminderId = 'period_expected' | 'daily_log';

export type ReminderTrigger =
  | { kind: 'date'; date: IsoDate; hour: number; minute: number }
  | { kind: 'daily'; hour: number; minute: number };

export interface ReminderPlan {
  id: ReminderId;
  title: string;
  body: string;
  trigger: ReminderTrigger;
}

export const REMINDER_IDS: readonly ReminderId[] = ['period_expected', 'daily_log'];
export const PERIOD_REMINDER_HOUR = 9;

/** Lock-screen copy. Discreet by default: no health words. */
const COPY = {
  period: {
    discreet: { title: 'Cycle', body: 'You have a reminder.' },
    plain: { title: 'Cycle', body: 'Your period may start in the next few days.' },
  },
  daily: {
    discreet: { title: 'Cycle', body: 'Quick check-in?' },
    plain: { title: 'Cycle', body: 'How are you feeling today? Log it in a few taps.' },
  },
} as const;

export function parseTime(hhmm: string): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  const hour = m ? Number(m[1]) : NaN;
  const minute = m ? Number(m[2]) : NaN;
  if (!m || hour < 0 || hour > 23 || minute < 0 || minute > 59) return { hour: 20, minute: 0 };
  return { hour, minute };
}

/**
 * Decides which local reminders should exist right now. Pure: the scheduler
 * diff-applies the result. Returns an empty list when nothing should be set.
 */
export function planReminders(
  settings: Pick<
    SettingsSchema,
    | 'reminder_period_enabled'
    | 'reminder_daily_log_enabled'
    | 'reminder_daily_log_time'
    | 'reminder_discreet'
  >,
  prediction: Prediction | null,
  today: IsoDate,
): ReminderPlan[] {
  const plans: ReminderPlan[] = [];
  const tone = settings.reminder_discreet ? 'discreet' : 'plain';

  if (settings.reminder_period_enabled && prediction && !prediction.isOverdue) {
    const date = addDays(prediction.earliest, -1);
    if (date > today) {
      plans.push({
        id: 'period_expected',
        ...COPY.period[tone],
        trigger: { kind: 'date', date, hour: PERIOD_REMINDER_HOUR, minute: 0 },
      });
    }
  }

  if (settings.reminder_daily_log_enabled) {
    const { hour, minute } = parseTime(settings.reminder_daily_log_time);
    plans.push({ id: 'daily_log', ...COPY.daily[tone], trigger: { kind: 'daily', hour, minute } });
  }

  return plans;
}
