import { router } from 'expo-router';

import { getRepos } from '@/services/bootstrap';
import { useSettingsStore } from '@/store';
import { Button, Screen, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';

/** Phase 1 placeholder. Real 5-screen onboarding lands in Phase 2. */
export default function OnboardingPlaceholder() {
  const { spacing } = useTheme();
  const setSetting = useSettingsStore((s) => s.set);

  async function finish() {
    await setSetting(getRepos().settings, 'onboarding_complete', true);
    router.replace('/(tabs)');
  }

  return (
    <Screen contentStyle={{ justifyContent: 'center' }}>
      <Text variant="display" style={{ marginBottom: spacing.sm }}>
        Your cycle, your device.
      </Text>
      <Text muted style={{ marginBottom: spacing.xl }}>
        Nothing you log here ever leaves this phone. No account, no cloud, no ads.
      </Text>
      <Button title="Continue" onPress={finish} fullWidth />
    </Screen>
  );
}
