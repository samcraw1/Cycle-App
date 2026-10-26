import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { DISCLAIMER_SHORT, PRIVACY_PROMISE } from '@/content/copy';
import { useOnboardingStore } from '@/store';
import { Card, OnboardingFrame, Text } from '@/ui/components';
import { TAP_TARGET, useTheme } from '@/ui/theme';

export default function PrivacyStep() {
  const { colors, radius, spacing } = useTheme();
  const accepted = useOnboardingStore((s) => s.disclaimerAccepted);
  const patch = useOnboardingStore((s) => s.patch);

  return (
    <OnboardingFrame
      step={1}
      title="Your cycle, your device."
      subtitle="A tracker built for irregular cycles that never sees your data."
      nextDisabled={!accepted}
      onNext={() => router.push('/(onboarding)/last-period')}
    >
      <Card style={{ marginBottom: spacing.md }}>
        {PRIVACY_PROMISE.map((line) => (
          <Text key={line} style={{ marginBottom: spacing.sm }}>
            • {line}
          </Text>
        ))}
      </Card>

      <Pressable
        onPress={() => patch({ disclaimerAccepted: !accepted })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        accessibilityLabel="I understand predictions are estimates, not medical advice or contraception"
        style={{ flexDirection: 'row', alignItems: 'center', minHeight: TAP_TARGET }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: radius.sm,
            borderWidth: 2,
            borderColor: accepted ? colors.accent : colors.textMuted,
            backgroundColor: accepted ? colors.accent : 'transparent',
            marginRight: spacing.sm,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {accepted ? (
            <Text color={colors.onAccent} variant="label">
              ✓
            </Text>
          ) : null}
        </View>
        <Text variant="caption" style={{ flex: 1 }}>
          {DISCLAIMER_SHORT} I understand.
        </Text>
      </Pressable>
    </OnboardingFrame>
  );
}
