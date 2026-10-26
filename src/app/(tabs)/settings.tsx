import { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { getRepos } from '@/services/bootstrap';
import { authenticate, getLockCapability, type LockCapability } from '@/services/lock/biometrics';
import { useLockStore, useSettingsStore } from '@/store';
import { Card, Screen, Text } from '@/ui/components';
import { TAP_TARGET, useTheme } from '@/ui/theme';

export default function SettingsScreen() {
  const { colors, spacing } = useTheme();
  const lockEnabled = useSettingsStore((s) => s.values.app_lock_enabled);
  const setSetting = useSettingsStore((s) => s.set);
  const setLockEnabled = useLockStore((s) => s.setEnabled);
  const [capability, setCapability] = useState<LockCapability | null>(null);

  useEffect(() => {
    getLockCapability()
      .then(setCapability)
      .catch(() => setCapability(null));
  }, []);

  async function toggleLock(next: boolean) {
    if (next) {
      // Prove the user can actually unlock before turning it on.
      const outcome = await authenticate('Confirm to enable App Lock');
      if (outcome !== 'success') {
        if (outcome === 'unavailable') {
          Alert.alert(
            'Not available',
            'Set up Face ID, Touch ID, or a passcode on this device first.',
          );
        }
        return;
      }
    }
    await setSetting(getRepos().settings, 'app_lock_enabled', next);
    setLockEnabled(next);
  }

  const lockLabel =
    capability?.kind === 'face'
      ? 'Face ID'
      : capability?.kind === 'fingerprint'
        ? 'Touch ID'
        : 'device passcode';

  return (
    <Screen scroll>
      <Text variant="title" style={{ marginBottom: spacing.lg }}>
        Settings
      </Text>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: TAP_TARGET }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text variant="heading">App Lock</Text>
            <Text variant="caption" muted>
              Require {lockLabel} to open the app.
            </Text>
          </View>
          <Switch
            value={lockEnabled}
            onValueChange={toggleLock}
            accessibilityLabel="App Lock"
            accessibilityHint={`Requires ${lockLabel} to open the app`}
            trackColor={{ true: colors.accent }}
          />
        </View>
      </Card>

      <Text variant="caption" muted style={{ marginTop: spacing.lg }}>
        Reminders, export, delete all data, and the privacy explainer arrive in Phase 3.
      </Text>
    </Screen>
  );
}
