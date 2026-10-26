import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/ui/theme';

import { Text } from './Text';

export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  const { spacing } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        variant="label"
        muted
        accessibilityRole="header"
        style={{ marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
