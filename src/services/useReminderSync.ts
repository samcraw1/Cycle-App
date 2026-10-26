import { useEffect } from 'react';

import { syncReminders } from '@/services/notifications';
import { useCycleStore, useSettingsStore } from '@/store';

/** Keeps scheduled reminders in step with logged data and settings. */
export function useReminderSync(): void {
  const periodDays = useCycleStore((s) => s.periodDays);
  const settings = useSettingsStore((s) => s.values);
  useEffect(() => {
    const t = setTimeout(() => void syncReminders().catch(() => undefined), 300);
    return () => clearTimeout(t);
  }, [periodDays, settings]);
}
