import type { IsoDate } from '@/domain/dates';
import type { Db } from '../types';

export const MOODS = ['great', 'good', 'okay', 'low', 'rough'] as const;
export type Mood = (typeof MOODS)[number];

export interface DayLog {
  date: IsoDate;
  mood: Mood | null;
  notes: string | null;
  symptomIds: string[];
}

interface DayLogRow {
  date: IsoDate;
  mood: Mood | null;
  notes: string | null;
}

interface DaySymptomRow {
  date: IsoDate;
  symptom_id: string;
}

export function createDayLogsRepo(db: Db) {
  async function symptomsFor(dates: readonly IsoDate[]): Promise<Map<IsoDate, string[]>> {
    const map = new Map<IsoDate, string[]>();
    if (dates.length === 0) return map;
    const placeholders = dates.map(() => '?').join(',');
    const rows = await db.getAllAsync<DaySymptomRow>(
      `SELECT date, symptom_id FROM day_symptoms WHERE date IN (${placeholders}) ORDER BY date, symptom_id`,
      ...dates,
    );
    for (const r of rows) {
      const list = map.get(r.date) ?? [];
      list.push(r.symptom_id);
      map.set(r.date, list);
    }
    return map;
  }

  return {
    async get(date: IsoDate): Promise<DayLog | null> {
      const row = await db.getFirstAsync<DayLogRow>(
        'SELECT date, mood, notes FROM day_logs WHERE date = ?',
        date,
      );
      const symptoms = (await symptomsFor([date])).get(date) ?? [];
      if (!row && symptoms.length === 0) return null;
      return { date, mood: row?.mood ?? null, notes: row?.notes ?? null, symptomIds: symptoms };
    },

    /** Replaces the whole log for a day. Empty log deletes the row. */
    async save(log: DayLog, now: Date = new Date()): Promise<void> {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM day_symptoms WHERE date = ?', log.date);
        const isEmpty = log.mood === null && !log.notes && log.symptomIds.length === 0;
        if (isEmpty) {
          await db.runAsync('DELETE FROM day_logs WHERE date = ?', log.date);
          return;
        }
        await db.runAsync(
          `INSERT INTO day_logs (date, mood, notes, updated_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(date) DO UPDATE SET mood = excluded.mood, notes = excluded.notes, updated_at = excluded.updated_at`,
          log.date,
          log.mood,
          log.notes,
          now.toISOString(),
        );
        for (const id of log.symptomIds) {
          await db.runAsync(
            'INSERT OR IGNORE INTO day_symptoms (date, symptom_id) VALUES (?, ?)',
            log.date,
            id,
          );
        }
      });
    },

    async listBetween(start: IsoDate, end: IsoDate): Promise<DayLog[]> {
      const rows = await db.getAllAsync<DayLogRow>(
        'SELECT date, mood, notes FROM day_logs WHERE date BETWEEN ? AND ? ORDER BY date ASC',
        start,
        end,
      );
      const symptomRows = await db.getAllAsync<DaySymptomRow>(
        'SELECT date, symptom_id FROM day_symptoms WHERE date BETWEEN ? AND ? ORDER BY date, symptom_id',
        start,
        end,
      );
      const byDate = new Map<IsoDate, DayLog>();
      for (const r of rows) byDate.set(r.date, { ...r, symptomIds: [] });
      for (const s of symptomRows) {
        const log = byDate.get(s.date) ?? { date: s.date, mood: null, notes: null, symptomIds: [] };
        log.symptomIds.push(s.symptom_id);
        byDate.set(s.date, log);
      }
      return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
    },
  };
}

export type DayLogsRepo = ReturnType<typeof createDayLogsRepo>;
