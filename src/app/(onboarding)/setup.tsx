import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { getRepos } from '@/services/bootstrap';
import { authenticate } from '@/services/lock/biometrics';
import { completeOnboarding } from '@/services/onboarding';
import { useOnboardingStore } from '@/store';
import { Card, OnboardingFrame, Text } from '@/ui/components';
import { TAP_TARGET, useTheme } from '@/ui/theme';

function Row({
  title,
  caption,
  value,
  onChange,
}: {
  title: string;
  caption: string;
  value: boolean;
  onChange(v: boolean): void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: TAP_TARGET,
        paddingVertical: spacing.xs,
      }}
    >
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text variant="heading">{title}</Text>
        <Text variant="caption" muted>
          {caption}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        trackColor={{ true: colors.accent }}
      />
    </View>
  );
}

export default function SetupStep() {
  const { spacing } = useTheme();
  const draft = useOnboardingStore();
  const [saving, setSaving] = useState(false);

  async function toggleLock(v: boolean) {
    if (v) {
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
    draft.patch({ appLock: v });
  }

  async function finish() {
    setSaving(true);
    try {
      await completeOnboarding(getRepos(), draft);
      draft.reset();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingFrame
      step={5}
      title="A couple of options"
      subtitle="All optional. Change them any time in Settings."
      nextLabel="Finish"
      onNext={finish}
      loading={saving}
    >
      <Card style={{ marginBottom: spacing.md }}>
        <Row
          title="App Lock"
          caption="Require Face ID, Touch ID, or passcode to open."
          value={draft.appLock}
          onChange={(v) => void toggleLock(v)}
        />
      </Card>
      <Card>
        <Row
          title="Period reminder"
          caption="A discreet heads-up a day before your expected range."
          value={draft.periodReminder}
          onChange={(v) => draft.patch({ periodReminder: v })}
        />
        <Row
          title="Daily log reminder"
          caption="A gentle nudge in the evening."
          value={draft.dailyReminder}
          onChange={(v) => draft.patch({ dailyReminder: v })}
        />
      </Card>
      <Text variant="caption" muted style={{ marginTop: spacing.md }}>
        Notifications never include health words on your lock screen.
      </Text>
    </OnboardingFrame>
  );
}
