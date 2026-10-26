import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  edges?: readonly Edge[];
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  contentStyle,
}: ScreenProps) {
  const { colors, spacing } = useTheme();
  const padded = [styles.content, { padding: spacing.md }, contentStyle];
  return (
    <SafeAreaView edges={[...edges]} style={[styles.root, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={padded} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={padded}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1 },
});
