import { router } from 'expo-router';
import { View } from 'react-native';

import { GOALS } from '@/content/copy';
import { useOnboardingStore } from '@/store';
import { Chip, OnboardingFrame } from '@/ui/components';

export default function GoalsStep() {
  const goals = useOnboardingStore((s) => s.goals);
  const toggle = useOnboardingStore((s) => s.toggleGoal);
  return (
    <OnboardingFrame
      step={4}
      title="What would help most?"
      subtitle="Pick any. This only shapes what we show first."
      onNext={() => router.push('/(onboarding)/setup')}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {GOALS.map((g) => (
          <Chip
            key={g.id}
            label={g.label}
            selected={goals.includes(g.id)}
            onPress={() => toggle(g.id)}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}
