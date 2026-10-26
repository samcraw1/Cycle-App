import { router } from 'expo-router';
import { Switch, View } from 'react-native';

import { useOnboardingStore } from '@/store';
import { Card, OnboardingFrame, Stepper, Text } from '@/ui/components';
import { TAP_TARGET, useTheme } from '@/ui/theme';

export default function CycleStep() {
  const { colors, spacing } = useTheme();
  const { cycleLength, periodLength, irregular, patch } = useOnboardingStore();

  return (
    <OnboardingFrame
      step={3}
      title="How long are your cycles, typically?"
      subtitle="From the first day of one period to the first day of the next. If you don't know, that's okay."
      onNext={() => router.push('/(onboarding)/goals')}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: TAP_TARGET }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text variant="heading">I don’t know / they’re irregular</Text>
            <Text variant="caption" muted>
              We’ll show wider, honest ranges until there’s enough history.
            </Text>
          </View>
          <Switch
            value={irregular}
            onValueChange={(v) => patch({ irregular: v })}
            accessibilityLabel="My cycles are irregular or I don't know"
            trackColor={{ true: colors.accent }}
          />
        </View>
      </Card>

      <View
        style={{ marginTop: spacing.lg, opacity: irregular ? 0.4 : 1 }}
        pointerEvents={irregular ? 'none' : 'auto'}
      >
        <Stepper
          label="Cycle length"
          value={cycleLength}
          min={15}
          max={90}
          onChange={(v) => patch({ cycleLength: v })}
        />
      </View>
      <Stepper
        label="Period length"
        value={periodLength}
        min={1}
        max={14}
        onChange={(v) => patch({ periodLength: v })}
      />
    </OnboardingFrame>
  );
}
