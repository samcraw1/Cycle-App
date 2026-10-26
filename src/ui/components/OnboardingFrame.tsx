import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/ui/theme';

import { Button } from './Button';
import { Screen } from './Screen';
import { Text } from './Text';

export const ONBOARDING_STEPS = 5;

interface Props extends PropsWithChildren {
  step: number;
  title: string;
  subtitle?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  onNext(): void | Promise<void>;
  onSkip?(): void;
  loading?: boolean;
}

export function OnboardingFrame({
  step,
  title,
  subtitle,
  nextLabel = 'Continue',
  nextDisabled = false,
  onNext,
  onSkip,
  loading = false,
  children,
}: Props) {
  const { colors, spacing } = useTheme();
  return (
    <Screen scroll edges={['top', 'left', 'right', 'bottom']}>
      <View
        style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.lg }}
        accessibilityLabel={`Step ${step} of ${ONBOARDING_STEPS}`}
        accessibilityRole="progressbar"
      >
        {Array.from({ length: ONBOARDING_STEPS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < step ? colors.accent : colors.border,
            }}
          />
        ))}
      </View>
      <Text variant="title" accessibilityRole="header" style={{ marginBottom: spacing.xs }}>
        {title}
      </Text>
      {subtitle ? (
        <Text muted style={{ marginBottom: spacing.lg }}>
          {subtitle}
        </Text>
      ) : (
        <View style={{ height: spacing.md }} />
      )}
      <View style={{ flex: 1 }}>{children}</View>
      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <Button
          title={nextLabel}
          onPress={() => void onNext()}
          disabled={nextDisabled}
          loading={loading}
          fullWidth
        />
        {onSkip ? <Button title="Skip for now" variant="ghost" onPress={onSkip} fullWidth /> : null}
      </View>
    </Screen>
  );
}
