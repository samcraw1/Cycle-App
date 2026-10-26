import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { TAP_TARGET, useTheme } from '@/ui/theme';

import { Text } from './Text';

interface RowProps extends PropsWithChildren {
  title: string;
  caption?: string;
  /** Right-side control (Switch, chevron, etc.). */
  right?: ReactNode;
  onPress?(): void;
  destructive?: boolean;
  accessibilityHint?: string;
}

/** A settings-style row with a 48pt minimum height. */
export function Row({
  title,
  caption,
  right,
  onPress,
  destructive = false,
  accessibilityHint,
  children,
}: RowProps) {
  const { colors, spacing } = useTheme();
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: TAP_TARGET,
        paddingVertical: spacing.xs,
      }}
    >
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text variant="heading" {...(destructive ? { color: colors.danger } : {})}>
          {title}
        </Text>
        {caption ? (
          <Text variant="caption" muted>
            {caption}
          </Text>
        ) : null}
        {children}
      </View>
      {right}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      {...(accessibilityHint ? { accessibilityHint } : {})}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {body}
    </Pressable>
  );
}
