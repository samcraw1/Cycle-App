import { create } from 'zustand';

import type { DayLog, PeriodDay, Repositories, Symptom } from '@/db';
import type { SymptomCategory } from '@/content/symptoms';
import { asIsoDate, type IsoDate } from '@/domain/dates';

const ALL_START = asIsoDate('2000-01-01');
const ALL_END = asIsoDate('2100-12-31');

interface CycleState {
  loaded: boolean;
  periodDays: PeriodDay[];
  dayLogs: Record<string, DayLog>;
  symptoms: Symptom[];
  load(repos: Repositories): Promise<void>;
  setPeriodDay(repos: Repositories, day: PeriodDay): Promise<void>;
  removePeriodDay(repos: Repositories, date: IsoDate): Promise<void>;
  saveDayLog(repos: Repositories, log: DayLog): Promise<void>;
  addCustomSymptom(repos: Repositories, label: string, category: SymptomCategory): Promise<Symptom>;
  setSymptomActive(repos: Repositories, id: string, active: boolean): Promise<void>;
  deleteCustomSymptom(repos: Repositories, id: string): Promise<void>;
  reset(): void;
}

const initial = { loaded: false, periodDays: [], dayLogs: {}, symptoms: [] };

export const useCycleStore = create<CycleState>((set, get) => ({
  ...initial,

  async load(repos) {
    const [periodDays, logs, symptoms] = await Promise.all([
      repos.periodDays.listAll(),
      repos.dayLogs.listBetween(ALL_START, ALL_END),
      repos.symptoms.listAll(),
    ]);
    const dayLogs: Record<string, DayLog> = {};
    for (const l of logs) dayLogs[l.date] = l;
    set({ periodDays, dayLogs, symptoms, loaded: true });
  },

  async setPeriodDay(repos, day) {
    await repos.periodDays.upsert(day);
    const rest = get().periodDays.filter((p) => p.date !== day.date);
    set({ periodDays: [...rest, day].sort((a, b) => (a.date < b.date ? -1 : 1)) });
  },

  async removePeriodDay(repos, date) {
    await repos.periodDays.remove(date);
    set({ periodDays: get().periodDays.filter((p) => p.date !== date) });
  },

  async saveDayLog(repos, log) {
    await repos.dayLogs.save(log);
    const dayLogs = { ...get().dayLogs };
    const isEmpty = log.mood === null && !log.notes && log.symptomIds.length === 0;
    if (isEmpty) delete dayLogs[log.date];
    else dayLogs[log.date] = log;
    set({ dayLogs });
  },

  async addCustomSymptom(repos, label, category) {
    const symptom = await repos.symptoms.addCustom(label, category);
    set({ symptoms: [...get().symptoms, symptom] });
    return symptom;
  },

  async setSymptomActive(repos, id, active) {
    await repos.symptoms.setActive(id, active);
    set({ symptoms: get().symptoms.map((s) => (s.id === id ? { ...s, isActive: active } : s)) });
  },

  async deleteCustomSymptom(repos, id) {
    await repos.symptoms.deleteCustom(id);
    const dayLogs = { ...get().dayLogs };
    for (const [date, log] of Object.entries(dayLogs)) {
      if (log.symptomIds.includes(id))
        dayLogs[date] = { ...log, symptomIds: log.symptomIds.filter((x) => x !== id) };
    }
    set({ symptoms: get().symptoms.filter((s) => s.id !== id), dayLogs });
  },

  reset() {
    set(initial);
  },
}));

/** Symptoms shown when logging. */
export const selectActiveSymptoms = (s: { symptoms: Symptom[] }) =>
  s.symptoms.filter((x) => x.isActive);
