import type { Repositories } from '@/db';
import { addDays } from '@/domain/dates';
import { track } from '@/services/analytics';
import { requestPermission } from '@/services/notifications';
import { useCycleStore, useLockStore, useSettingsStore, type OnboardingDraft } from '@/store';

const MAX_SEEDED_PERIOD_DAYS = 10;

/** Persists the onboarding answers and seeds the first period. */
export async function completeOnboarding(
  repos: Repositories,
  draft: OnboardingDraft,
): Promise<void> {
  const settings = useSettingsStore.getState();
  const s = repos.settings;
  await Promise.all([
    settings.set(s, 'disclaimer_acknowledged', draft.disclaimerAccepted),
    settings.set(s, 'estimated_cycle_length', draft.irregular ? null : draft.cycleLength),
    settings.set(s, 'estimated_period_length', draft.periodLength),
    settings.set(s, 'cycles_irregular', draft.irregular),
    settings.set(s, 'goals', draft.goals),
    settings.set(s, 'app_lock_enabled', draft.appLock),
    settings.set(s, 'reminder_period_enabled', draft.periodReminder),
    settings.set(s, 'reminder_daily_log_enabled', draft.dailyReminder),
  ]);

  if (draft.lastPeriodStart) {
    const cycle = useCycleStore.getState();
    const n = Math.min(MAX_SEEDED_PERIOD_DAYS, Math.max(1, draft.periodLength));
    for (let i = 0; i < n; i += 1) {
      await cycle.setPeriodDay(repos, { date: addDays(draft.lastPeriodStart, i), flow: 'medium' });
    }
  }

  if (draft.periodReminder || draft.dailyReminder) {
    // Ask now so reminders the user just opted into can actually fire.
    await requestPermission().catch(() => undefined);
  }

  await settings.set(s, 'onboarding_complete', true);
  useLockStore.getState().setEnabled(draft.appLock);
  track('onboarding_completed');
}
