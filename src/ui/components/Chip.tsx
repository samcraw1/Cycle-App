import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/ui/theme';

import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress(): void;
  /** Visual tone when selected. */
  tone?: 'accent' | 'period';
  accessibilityHint?: string;
}

export function Chip({ label, selected, onPress, tone = 'accent', accessibilityHint }: ChipProps) {
  const { colors, radius, spacing } = useTheme();
  const fill = tone === 'period' ? colors.period : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      {...(accessibilityHint ? { accessibilityHint } : {})}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? fill : colors.surface,
          borderColor: selected ? fill : colors.border,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text variant="label" color={selected ? colors.onAccent : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
});
