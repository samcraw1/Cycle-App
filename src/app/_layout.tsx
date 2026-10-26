import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bootstrap } from '@/services/bootstrap';
import { useReminderSync } from '@/services/useReminderSync';
import { Button, LockGate, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, scheme, spacing } = useTheme();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    bootstrap()
      .then(() => setReady(true))
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => void SplashScreen.hideAsync());
  }, []);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <Text variant="title" style={{ marginBottom: spacing.sm }}>
          Something went wrong
        </Text>
        <Text muted style={{ textAlign: 'center', marginBottom: spacing.lg }}>
          {error.message}
        </Text>
        <Button
          title="Try again"
          onPress={() => {
            setError(null);
            bootstrap()
              .then(() => setReady(true))
              .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))));
          }}
        />
      </View>
    );
  }

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ReminderSync />
      <LockGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="log/[date]"
            options={{ presentation: 'modal', headerShown: true, title: 'Log' }}
          />
          <Stack.Screen
            name="paywall"
            options={{ presentation: 'modal', headerShown: true, title: 'Premium' }}
          />
        </Stack>
      </LockGate>
    </SafeAreaProvider>
  );
}

function ReminderSync() {
  useReminderSync();
  return null;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
