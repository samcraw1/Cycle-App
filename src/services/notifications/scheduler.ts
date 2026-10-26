import * as Notifications from 'expo-notifications';
import {
  AndroidImportance,
  AndroidNotificationVisibility,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { fromIsoDate } from '@/domain/dates';

import { REMINDER_IDS, type ReminderPlan } from './plan';

let handlerConfigured = false;

/** Show reminders even while the app is in the foreground. Call once at boot. */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export type PermissionOutcome = 'granted' | 'denied' | 'undetermined';

export async function getPermission(): Promise<PermissionOutcome> {
  const res = await Notifications.getPermissionsAsync();
  return toOutcome(res);
}

export async function requestPermission(): Promise<PermissionOutcome> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: AndroidImportance.DEFAULT,
      lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
    });
  }
  const res = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: false },
  });
  return toOutcome(res);
}

function toOutcome(res: Notifications.NotificationPermissionsStatus): PermissionOutcome {
  if (Platform.OS === 'ios' && res.ios) {
    const s = res.ios.status;
    if (s === IosAuthorizationStatus.AUTHORIZED || s === IosAuthorizationStatus.PROVISIONAL) {
      return 'granted';
    }
    if (s === IosAuthorizationStatus.NOT_DETERMINED) return 'undetermined';
    return 'denied';
  }
  if (res.granted) return 'granted';
  return res.canAskAgain ? 'undetermined' : 'denied';
}

function toTrigger(plan: ReminderPlan): Notifications.NotificationTriggerInput {
  const t = plan.trigger;
  if (t.kind === 'daily') {
    return {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: t.hour,
      minute: t.minute,
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    };
  }
  const date = fromIsoDate(t.date);
  date.setHours(t.hour, t.minute, 0, 0);
  return {
    type: SchedulableTriggerInputTypes.DATE,
    date,
    ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
  };
}

/**
 * Replaces all app reminders with the given plan. Cancels any reminder not in
 * the plan. Safe to call often; it is cheap and idempotent.
 */
export async function applyReminderPlan(plans: readonly ReminderPlan[]): Promise<void> {
  await Promise.all(
    REMINDER_IDS.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
  if (plans.length === 0) return;
  if ((await getPermission()) !== 'granted') return;
  if (__DEV__)
    console.log(
      '[reminders] scheduling',
      plans.map((p) => `${p.id}@${JSON.stringify(p.trigger)}`).join(' '),
    );
  for (const plan of plans) {
    await Notifications.scheduleNotificationAsync({
      identifier: plan.id,
      content: { title: plan.title, body: plan.body, sound: false },
      trigger: toTrigger(plan),
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
