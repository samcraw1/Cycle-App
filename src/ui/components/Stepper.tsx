import { Pressable, StyleSheet, View } from 'react-native';

import { TAP_TARGET, useTheme } from '@/ui/theme';

import { Text } from './Text';

export interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange(next: number): void;
}

export function Stepper({ label, value, min, max, unit = 'days', onChange }: StepperProps) {
  const { colors, radius, spacing } = useTheme();
  const btn = (delta: number, glyph: string, name: string) => {
    const next = value + delta;
    const disabled = next < min || next > max;
    return (
      <Pressable
        onPress={() => onChange(next)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${name} ${label}`}
        accessibilityState={{ disabled }}
        style={[
          styles.btn,
          {
            backgroundColor: colors.accentSoft,
            borderRadius: radius.md,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <Text variant="title" color={colors.accent}>
          {glyph}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={[styles.row, { paddingVertical: spacing.sm }]}>
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      {btn(-1, '−', 'Decrease')}
      <Text
        variant="heading"
        accessibilityLiveRegion="polite"
        style={{ minWidth: 88, textAlign: 'center' }}
      >
        {value} {unit}
      </Text>
      {btn(1, '+', 'Increase')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { width: TAP_TARGET, height: TAP_TARGET, alignItems: 'center', justifyContent: 'center' },
});
