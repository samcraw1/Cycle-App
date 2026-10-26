import type { Db } from '../types';

/** Typed settings keys. Values are JSON-encoded in the `settings` table. */
export interface SettingsSchema {
  onboarding_complete: boolean;
  app_lock_enabled: boolean;
  /** Onboarding estimate used until enough cycles are logged. */
  estimated_cycle_length: number | null;
  estimated_period_length: number | null;
  cycles_irregular: boolean;
  reminder_period_enabled: boolean;
  reminder_daily_log_enabled: boolean;
  reminder_daily_log_time: string; // "HH:mm"
  reminder_discreet: boolean;
  goals: string[];
  disclaimer_acknowledged: boolean;
}

export type SettingsKey = keyof SettingsSchema;

export const SETTINGS_DEFAULTS: SettingsSchema = {
  onboarding_complete: false,
  app_lock_enabled: false,
  estimated_cycle_length: null,
  estimated_period_length: null,
  cycles_irregular: false,
  reminder_period_enabled: false,
  reminder_daily_log_enabled: false,
  reminder_daily_log_time: '20:00',
  reminder_discreet: true,
  goals: [],
  disclaimer_acknowledged: false,
};

export function createSettingsRepo(db: Db) {
  return {
    async get<K extends SettingsKey>(key: K): Promise<SettingsSchema[K]> {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        key,
      );
      if (!row) return SETTINGS_DEFAULTS[key];
      try {
        return JSON.parse(row.value) as SettingsSchema[K];
      } catch {
        return SETTINGS_DEFAULTS[key];
      }
    },

    async getAll(): Promise<SettingsSchema> {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM settings',
      );
      const out: SettingsSchema = { ...SETTINGS_DEFAULTS };
      for (const row of rows) {
        if (!(row.key in SETTINGS_DEFAULTS)) continue;
        try {
          (out as unknown as Record<string, unknown>)[row.key] = JSON.parse(row.value);
        } catch {
          /* keep default */
        }
      }
      return out;
    },

    async set<K extends SettingsKey>(key: K, value: SettingsSchema[K]): Promise<void> {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        JSON.stringify(value),
      );
    },

    async remove(key: SettingsKey): Promise<void> {
      await db.runAsync('DELETE FROM settings WHERE key = ?', key);
    },
  };
}

export type SettingsRepo = ReturnType<typeof createSettingsRepo>;
