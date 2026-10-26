import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/ui/theme';

export function Card({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
