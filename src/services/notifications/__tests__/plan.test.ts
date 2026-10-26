import { asIsoDate } from '@/domain/dates';
import type { Prediction } from '@/domain/prediction';

import { parseTime, planReminders } from '../plan';

const d = asIsoDate;
const prediction: Prediction = {
  expectedStart: d('2026-11-09'),
  earliest: d('2026-11-05'),
  latest: d('2026-11-13'),
  halfWidth: 4,
  confidence: 'low',
  basis: 'estimate',
  cyclesUsed: 0,
  averageCycleLength: 28,
  variability: 0,
  isOverdue: false,
  daysOverdue: 0,
};
const base = {
  reminder_period_enabled: true,
  reminder_daily_log_enabled: true,
  reminder_daily_log_time: '20:30',
  reminder_discreet: true,
};

describe('planReminders', () => {
  it('schedules a discreet period reminder the day before the range and a daily log', () => {
    const plans = planReminders(base, prediction, d('2026-10-26'));
    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({
      id: 'period_expected',
      body: 'You have a reminder.',
      trigger: { kind: 'date', date: '2026-11-04', hour: 9 },
    });
    expect(plans[1]).toMatchObject({
      id: 'daily_log',
      trigger: { kind: 'daily', hour: 20, minute: 30 },
    });
    for (const p of plans) {
      expect(p.title.toLowerCase()).not.toMatch(/period|symptom|cramp/);
      expect(p.body.toLowerCase()).not.toMatch(/period|symptom|cramp/);
    }
  });
  it('uses plain copy when discreet is off', () => {
    const plans = planReminders({ ...base, reminder_discreet: false }, prediction, d('2026-10-26'));
    expect(plans[0]?.body).toMatch(/period/);
  });
  it('skips the period reminder when its date has passed, when overdue, or with no prediction', () => {
    expect(planReminders(base, prediction, d('2026-11-04')).map((p) => p.id)).toEqual([
      'daily_log',
    ]);
    expect(
      planReminders(base, { ...prediction, isOverdue: true }, d('2026-10-26')).map((p) => p.id),
    ).toEqual(['daily_log']);
    expect(planReminders(base, null, d('2026-10-26')).map((p) => p.id)).toEqual(['daily_log']);
  });
  it('returns nothing when both reminders are off', () => {
    expect(
      planReminders(
        { ...base, reminder_period_enabled: false, reminder_daily_log_enabled: false },
        prediction,
        d('2026-10-26'),
      ),
    ).toEqual([]);
  });
  it('parseTime falls back to 20:00 on bad input', () => {
    expect(parseTime('07:05')).toEqual({ hour: 7, minute: 5 });
    expect(parseTime('25:00')).toEqual({ hour: 20, minute: 0 });
    expect(parseTime('nope')).toEqual({ hour: 20, minute: 0 });
  });
});
