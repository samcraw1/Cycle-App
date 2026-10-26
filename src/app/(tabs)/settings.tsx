import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Switch, View } from 'react-native';

import { DISCLAIMER_SHORT } from '@/content/copy';
import { getRepos } from '@/services/bootstrap';
import { deleteAllData, shareExport, type ExportFormat } from '@/services/export';
import { authenticate, getLockCapability, type LockCapability } from '@/services/lock/biometrics';
import { getPermission, requestPermission } from '@/services/notifications';
import { useEntitlementsStore, useLockStore, useSettingsStore } from '@/store';
import { Card, Chip, Row, Screen, Section, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';

const TIMES = ['08:00', '12:00', '18:00', '20:00', '21:30'];

export default function SettingsScreen() {
  const { colors, spacing } = useTheme();
  const values = useSettingsStore((s) => s.values);
  const setSetting = useSettingsStore((s) => s.set);
  const setLockEnabled = useLockStore((s) => s.setEnabled);
  const premium = useEntitlementsStore((s) => s.premium);
  const [capability, setCapability] = useState<LockCapability | null>(null);
  const [busy, setBusy] = useState<ExportFormat | 'delete' | null>(null);

  useEffect(() => {
    getLockCapability()
      .then(setCapability)
      .catch(() => setCapability(null));
  }, []);

  const repos = () => getRepos().settings;

  async function toggleLock(next: boolean) {
    if (next) {
      const outcome = await authenticate('Confirm to enable App Lock');
      if (outcome !== 'success') {
        if (outcome === 'unavailable')
          Alert.alert(
            'Not available',
            'Set up Face ID, Touch ID, or a passcode on this device first.',
          );
        return;
      }
    }
    await setSetting(repos(), 'app_lock_enabled', next);
    setLockEnabled(next);
  }

  async function ensureNotificationPermission(): Promise<boolean> {
    const current = await getPermission();
    if (current === 'granted') return true;
    const after = await requestPermission();
    if (after === 'granted') return true;
    Alert.alert(
      'Notifications are off',
      'Allow notifications for Cycle in iOS Settings to get reminders.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
    return false;
  }

  async function toggleReminder(
    key: 'reminder_period_enabled' | 'reminder_daily_log_enabled',
    next: boolean,
  ) {
    if (next && !(await ensureNotificationPermission())) return;
    await setSetting(repos(), key, next);
  }

  async function exportData(format: ExportFormat) {
    setBusy(format);
    try {
      const result = await shareExport(getRepos(), format);
      if (result === 'unavailable')
        Alert.alert('Sharing unavailable', 'This device cannot open a share sheet.');
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete everything?',
      'This removes every period, symptom, note, and setting from this phone. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all data',
          style: 'destructive',
          onPress: () => {
            setBusy('delete');
            deleteAllData()
              .then(() => router.replace('/(onboarding)'))
              .catch((e: unknown) =>
                Alert.alert(
                  'Could not delete',
                  e instanceof Error ? e.message : 'Please try again.',
                ),
              )
              .finally(() => setBusy(null));
          },
        },
      ],
    );
  }

  const lockLabel =
    capability?.kind === 'face'
      ? 'Face ID'
      : capability?.kind === 'fingerprint'
        ? 'Touch ID'
        : 'device passcode';
  const sw = (value: boolean, onChange: (v: boolean) => void, label: string) => (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ true: colors.accent }}
    />
  );

  return (
    <Screen scroll>
      <Text variant="title" accessibilityRole="header" style={{ marginBottom: spacing.lg }}>
        Settings
      </Text>

      <Section title="Privacy">
        <Card>
          <Row
            title="App Lock"
            caption={`Require ${lockLabel} to open the app.`}
            right={sw(values.app_lock_enabled, (v) => void toggleLock(v), 'App Lock')}
          />
          <Row
            title="How your data is handled"
            caption="Plain-English explanation of what is stored and where."
            onPress={() => router.push('/privacy')}
            right={<Text color={colors.accent}>›</Text>}
          />
        </Card>
      </Section>

      <Section title="Reminders">
        <Card>
          <Row
            title="Period reminder"
            caption="The day before your expected range, at 9:00."
            right={sw(
              values.reminder_period_enabled,
              (v) => void toggleReminder('reminder_period_enabled', v),
              'Period reminder',
            )}
          />
          <Row
            title="Daily log reminder"
            caption="A gentle nudge to log the day."
            right={sw(
              values.reminder_daily_log_enabled,
              (v) => void toggleReminder('reminder_daily_log_enabled', v),
              'Daily log reminder',
            )}
          >
            {values.reminder_daily_log_enabled ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }}>
                {TIMES.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selected={values.reminder_daily_log_time === t}
                    onPress={() => void setSetting(repos(), 'reminder_daily_log_time', t)}
                  />
                ))}
              </View>
            ) : null}
          </Row>
          <Row
            title="Discreet wording"
            caption="Reminders never mention periods or symptoms on the lock screen."
            right={sw(
              values.reminder_discreet,
              (v) => void setSetting(repos(), 'reminder_discreet', v),
              'Discreet wording',
            )}
          />
        </Card>
      </Section>

      <Section title="Your data">
        <Card>
          <Row
            title={busy === 'json' ? 'Preparing…' : 'Export as JSON'}
            caption="Everything, for backup or moving phones."
            onPress={() => void exportData('json')}
            right={<Text color={colors.accent}>›</Text>}
          />
          <Row
            title={busy === 'csv' ? 'Preparing…' : 'Export as CSV'}
            caption="One row per day, opens in any spreadsheet."
            onPress={() => void exportData('csv')}
            right={<Text color={colors.accent}>›</Text>}
          />
          <Row
            title={busy === 'delete' ? 'Deleting…' : 'Delete everything'}
            caption="Erase all data from this phone."
            onPress={confirmDelete}
            destructive
            accessibilityHint="Asks for confirmation first"
          />
        </Card>
      </Section>

      <Section title="Premium">
        <Card>
          <Row
            title={premium ? 'Premium is active' : 'Cycle Premium'}
            caption={
              premium
                ? 'Thank you for supporting a tracker that never sells your data.'
                : 'Phase insights, doctor-ready report, custom categories.'
            }
            {...(premium
              ? {}
              : {
                  onPress: () => router.push('/paywall'),
                  right: <Text color={colors.accent}>›</Text>,
                })}
          />
          {__DEV__ ? (
            <Row
              title="Dev: premium"
              caption="Mock entitlement toggle (dev builds only)."
              right={sw(
                premium,
                (v) => useEntitlementsStore.setState({ premium: v }),
                'Dev premium toggle',
              )}
            />
          ) : null}
        </Card>
      </Section>

      <Section title="About">
        <Card>
          <Text variant="caption" muted>
            {DISCLAIMER_SHORT}
          </Text>
          <Text variant="caption" muted style={{ marginTop: spacing.sm }}>
            Cycle {Constants.expoConfig?.version ?? ''} · No account · No cloud · No ads
          </Text>
        </Card>
      </Section>
    </Screen>
  );
}
