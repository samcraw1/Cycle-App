import { Stack, type ErrorBoundaryProps } from 'expo-router';
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
  const { colors, scheme } = useTheme();
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
      <FatalScreen
        title="Could not open your data"
        message={error.message}
        onRetry={() => {
          setError(null);
          bootstrap()
            .then(() => setReady(true))
            .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))));
        }}
      />
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
          <Stack.Screen
            name="privacy"
            options={{ presentation: 'modal', headerShown: true, title: 'Privacy' }}
          />
          <Stack.Screen
            name="symptoms"
            options={{ presentation: 'modal', headerShown: true, title: 'Symptoms' }}
          />
        </Stack>
      </LockGate>
    </SafeAreaProvider>
  );
}

/** Catches render errors anywhere in the tree. Data is safe: nothing is lost on a crash. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <FatalScreen
      title="Something went wrong"
      message={error.message}
      onRetry={() => void retry()}
    />
  );
}

function FatalScreen({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry(): void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.background, padding: spacing.lg }]}>
      <Text variant="title" style={{ marginBottom: spacing.sm }}>
        {title}
      </Text>
      <Text muted style={{ textAlign: 'center', marginBottom: spacing.sm }}>
        Your data is safe on this phone. Try again, or restart the app.
      </Text>
      {__DEV__ ? (
        <Text variant="caption" muted style={{ textAlign: 'center', marginBottom: spacing.lg }}>
          {message}
        </Text>
      ) : null}
      <Button title="Try again" onPress={onRetry} />
    </View>
  );
}

function ReminderSync() {
  useReminderSync();
  return null;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
