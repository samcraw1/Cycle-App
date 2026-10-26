import type { Db } from '../types';
import { createDayLogsRepo } from './dayLogsRepo';
import { createPeriodDaysRepo } from './periodDaysRepo';
import { createSettingsRepo } from './settingsRepo';
import { createSymptomsRepo } from './symptomsRepo';

export * from './dayLogsRepo';
export * from './periodDaysRepo';
export * from './settingsRepo';
export * from './symptomsRepo';

export function createRepositories(db: Db) {
  return {
    settings: createSettingsRepo(db),
    periodDays: createPeriodDaysRepo(db),
    dayLogs: createDayLogsRepo(db),
    symptoms: createSymptomsRepo(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
