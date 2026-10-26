import { today } from '@/domain/dates';
import { summarizeCycles, useCycleStore, useSettingsStore } from '@/store';

import { planReminders } from './plan';
import { applyReminderPlan } from './scheduler';

/** Recomputes and re-applies local reminders from current state. */
export async function syncReminders(): Promise<void> {
  const settings = useSettingsStore.getState().values;
  const { periodDays } = useCycleStore.getState();
  const now = today();
  const { prediction } = summarizeCycles(periodDays, settings, now);
  await applyReminderPlan(planReminders(settings, prediction, now));
}
