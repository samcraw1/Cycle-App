import type { DayLog, PeriodDay, SettingsSchema, Symptom } from '@/db/repositories';

export const EXPORT_FORMAT_VERSION = 1;

export interface ExportBundle {
  format: 'cycle-app-export';
  formatVersion: number;
  exportedAt: string;
  periodDays: PeriodDay[];
  dayLogs: DayLog[];
  symptoms: Symptom[];
  settings: Partial<SettingsSchema>;
}

/** Settings worth exporting (no device-specific or security flags). */
const EXPORTED_SETTINGS: (keyof SettingsSchema)[] = [
  'estimated_cycle_length',
  'estimated_period_length',
  'cycles_irregular',
  'goals',
];

export function buildBundle(
  input: {
    periodDays: PeriodDay[];
    dayLogs: DayLog[];
    symptoms: Symptom[];
    settings: SettingsSchema;
  },
  now: Date = new Date(),
): ExportBundle {
  const settings: Partial<SettingsSchema> = {};
  for (const k of EXPORTED_SETTINGS) (settings as Record<string, unknown>)[k] = input.settings[k];
  return {
    format: 'cycle-app-export',
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    periodDays: [...input.periodDays].sort((a, b) => (a.date < b.date ? -1 : 1)),
    dayLogs: [...input.dayLogs].sort((a, b) => (a.date < b.date ? -1 : 1)),
    symptoms: input.symptoms,
    settings,
  };
}

export function toJson(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

function csvCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

/** One row per day that has any data. Symptoms are labels joined with "; ". */
export function toCsv(bundle: ExportBundle): string {
  const labels = new Map(bundle.symptoms.map((s) => [s.id, s.label]));
  const rows = new Map<
    string,
    { flow?: string; mood?: string; symptoms?: string; notes?: string }
  >();
  for (const p of bundle.periodDays) rows.set(p.date, { ...rows.get(p.date), flow: p.flow });
  for (const l of bundle.dayLogs) {
    rows.set(l.date, {
      ...rows.get(l.date),
      ...(l.mood ? { mood: l.mood } : {}),
      ...(l.symptomIds.length
        ? { symptoms: l.symptomIds.map((id) => labels.get(id) ?? id).join('; ') }
        : {}),
      ...(l.notes ? { notes: l.notes } : {}),
    });
  }
  const header = 'date,period_flow,mood,symptoms,notes';
  const lines = [...rows.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, r]) =>
      [date, csvCell(r.flow), csvCell(r.mood), csvCell(r.symptoms), csvCell(r.notes)].join(','),
    );
  return [header, ...lines].join('\n') + '\n';
}
