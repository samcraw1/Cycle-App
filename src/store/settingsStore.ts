import { create } from 'zustand';

import { SETTINGS_DEFAULTS, type SettingsKey, type SettingsRepo, type SettingsSchema } from '@/db';

interface SettingsState {
  hydrated: boolean;
  values: SettingsSchema;
  hydrate(repo: SettingsRepo): Promise<void>;
  set<K extends SettingsKey>(repo: SettingsRepo, key: K, value: SettingsSchema[K]): Promise<void>;
  reset(): void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hydrated: false,
  values: SETTINGS_DEFAULTS,

  async hydrate(repo) {
    const values = await repo.getAll();
    set({ values, hydrated: true });
  },

  async set(repo, key, value) {
    await repo.set(key, value);
    set((s) => ({ values: { ...s.values, [key]: value } }));
  },

  reset() {
    set({ values: SETTINGS_DEFAULTS, hydrated: false });
  },
}));
