import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { useLockStore } from '@/store';
import { useTheme } from '@/ui/theme';

import { Button } from './Button';
import { Text } from './Text';

/**
 * Renders children always (so state persists) but covers them with an
 * opaque lock screen while locked. Also hides content in the app switcher
 * snapshot by locking on background.
 */
export function LockGate({ children }: PropsWithChildren) {
  const { colors, spacing } = useTheme();
  const locked = useLockStore((s) => s.locked);
  const enabled = useLockStore((s) => s.enabled);
  const unlock = useLockStore((s) => s.unlock);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const store = useLockStore.getState();
      if (state === 'active') store.onForeground();
      else store.onBackground();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (enabled && locked) void tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, locked]);

  async function tryUnlock() {
    if (busy) return;
    setBusy(true);
    setHint(null);
    const outcome = await unlock();
    if (outcome === 'unavailable')
      setHint('Biometrics unavailable. Turn off App Lock in device settings to continue.');
    else if (outcome === 'failed') setHint('Could not verify. Try again.');
    setBusy(false);
  }

  return (
    <View style={styles.fill}>
      {children}
      {enabled && locked ? (
        <View
          accessibilityViewIsModal
          style={[
            StyleSheet.absoluteFill,
            styles.overlay,
            { backgroundColor: colors.background, padding: spacing.lg },
          ]}
        >
          <Text variant="title" style={{ marginBottom: spacing.sm }}>
            Locked
          </Text>
          <Text muted style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
            Unlock to see your data.
          </Text>
          <Button title="Unlock" onPress={tryUnlock} loading={busy} />
          {hint ? (
            <Text variant="caption" muted style={{ marginTop: spacing.md, textAlign: 'center' }}>
              {hint}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { alignItems: 'center', justifyContent: 'center' },
});
