import { router } from 'expo-router';
import { useState } from 'react';

import { today } from '@/domain/dates';
import { useOnboardingStore } from '@/store';
import { MonthGrid, OnboardingFrame, Text } from '@/ui/components';
import { formatDayLong } from '@/ui/format';
import { useTheme } from '@/ui/theme';

export default function LastPeriodStep() {
  const { spacing } = useTheme();
  const now = today();
  const [month, setMonth] = useState(now);
  const selected = useOnboardingStore((s) => s.lastPeriodStart);
  const patch = useOnboardingStore((s) => s.patch);

  return (
    <OnboardingFrame
      step={2}
      title="When did your last period start?"
      subtitle="Your best guess is fine. You can change it later."
      nextDisabled={!selected}
      onNext={() => router.push('/(onboarding)/cycle')}
      onSkip={() => {
        patch({ lastPeriodStart: null });
        router.push('/(onboarding)/cycle');
      }}
    >
      <MonthGrid
        month={month}
        today={now}
        maxDate={now}
        selected={selected}
        onSelectDay={(d) => patch({ lastPeriodStart: d })}
        onChangeMonth={setMonth}
      />
      <Text
        muted
        accessibilityLiveRegion="polite"
        style={{ marginTop: spacing.md, textAlign: 'center' }}
      >
        {selected ? `Selected: ${formatDayLong(selected)}` : 'Tap a day'}
      </Text>
    </OnboardingFrame>
  );
}
