import { create } from 'zustand';

import { authenticate, type AuthOutcome } from '@/services/lock/biometrics';

/** Re-lock if the app was backgrounded longer than this. */
export const LOCK_GRACE_MS = 30_000;

interface LockState {
  enabled: boolean;
  locked: boolean;
  /** Timestamp when the app last went to background, null while active. */
  backgroundedAt: number | null;
  setEnabled(enabled: boolean): void;
  /** Called on AppState -> background/inactive. */
  onBackground(now?: number): void;
  /** Called on AppState -> active. Decides whether to lock. */
  onForeground(now?: number): void;
  unlock(): Promise<AuthOutcome>;
  /** Test/dev escape hatch; no auth prompt. */
  forceUnlock(): void;
}

export const useLockStore = create<LockState>((set, get) => ({
  enabled: false,
  locked: false,
  backgroundedAt: null,

  setEnabled(enabled) {
    set({ enabled, locked: enabled ? get().locked : false });
  },

  onBackground(now = Date.now()) {
    if (!get().enabled) return;
    set({ backgroundedAt: now });
  },

  onForeground(now = Date.now()) {
    const { enabled, backgroundedAt } = get();
    if (!enabled) return;
    if (backgroundedAt !== null && now - backgroundedAt >= LOCK_GRACE_MS) {
      set({ locked: true });
    }
    set({ backgroundedAt: null });
  },

  async unlock() {
    const outcome = await authenticate('Unlock Cycle');
    if (outcome === 'success') set({ locked: false });
    return outcome;
  },

  forceUnlock() {
    set({ locked: false });
  },
}));

/** Lock immediately on cold start when the feature is enabled. */
export function initializeLock(enabled: boolean): void {
  useLockStore.setState({ enabled, locked: enabled, backgroundedAt: null });
}
