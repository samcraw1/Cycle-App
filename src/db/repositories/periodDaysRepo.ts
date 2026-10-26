import type { IsoDate } from '@/domain/dates';
import type { Db } from '../types';

export const FLOWS = ['spotting', 'light', 'medium', 'heavy'] as const;
export type Flow = (typeof FLOWS)[number];

export interface PeriodDay {
  date: IsoDate;
  flow: Flow;
}

export function createPeriodDaysRepo(db: Db) {
  return {
    async upsert(day: PeriodDay): Promise<void> {
      await db.runAsync(
        'INSERT INTO period_days (date, flow) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET flow = excluded.flow',
        day.date,
        day.flow,
      );
    },

    async remove(date: IsoDate): Promise<void> {
      await db.runAsync('DELETE FROM period_days WHERE date = ?', date);
    },

    async get(date: IsoDate): Promise<PeriodDay | null> {
      return db.getFirstAsync<PeriodDay>('SELECT date, flow FROM period_days WHERE date = ?', date);
    },

    /** All period days ascending by date. */
    async listAll(): Promise<PeriodDay[]> {
      return db.getAllAsync<PeriodDay>('SELECT date, flow FROM period_days ORDER BY date ASC');
    },

    async listBetween(start: IsoDate, end: IsoDate): Promise<PeriodDay[]> {
      return db.getAllAsync<PeriodDay>(
        'SELECT date, flow FROM period_days WHERE date BETWEEN ? AND ? ORDER BY date ASC',
        start,
        end,
      );
    },
  };
}

export type PeriodDaysRepo = ReturnType<typeof createPeriodDaysRepo>;
