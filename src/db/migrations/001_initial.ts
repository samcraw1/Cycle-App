import type { Migration } from '../migrate';

export const m001Initial: Migration = {
  version: 1,
  name: '001_initial',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE symptoms (
        id TEXT PRIMARY KEY NOT NULL,
        label TEXT NOT NULL,
        category TEXT NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0, 1)),
        is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE period_days (
        date TEXT PRIMARY KEY NOT NULL CHECK (length(date) = 10),
        flow TEXT NOT NULL CHECK (flow IN ('spotting', 'light', 'medium', 'heavy'))
      );

      CREATE TABLE day_logs (
        date TEXT PRIMARY KEY NOT NULL CHECK (length(date) = 10),
        mood TEXT,
        notes TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE day_symptoms (
        date TEXT NOT NULL CHECK (length(date) = 10),
        symptom_id TEXT NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
        PRIMARY KEY (date, symptom_id)
      );
      CREATE INDEX idx_day_symptoms_symptom ON day_symptoms(symptom_id);
    `);
  },
};
