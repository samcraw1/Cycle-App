import { SETTINGS_DEFAULTS, type DayLog, type PeriodDay, type Symptom } from '@/db/repositories';
import { asIsoDate } from '@/domain/dates';

import { buildBundle, toCsv, toJson } from '../bundle';

const d = asIsoDate;
const symptoms: Symptom[] = [
  {
    id: 'cramps',
    label: 'Cramps',
    category: 'physical',
    isCustom: false,
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'custom_1',
    label: 'Night "sweats", bad',
    category: 'other',
    isCustom: true,
    isActive: true,
    sortOrder: 10,
  },
];
const periodDays: PeriodDay[] = [
  { date: d('2026-03-02'), flow: 'heavy' },
  { date: d('2026-03-01'), flow: 'light' },
];
const dayLogs: DayLog[] = [
  {
    date: d('2026-03-02'),
    mood: 'low',
    notes: 'line one\nline two',
    symptomIds: ['cramps', 'custom_1'],
  },
  { date: d('2026-03-10'), mood: null, notes: null, symptomIds: ['cramps'] },
];
const now = new Date('2026-03-15T12:00:00Z');

describe('buildBundle', () => {
  it('sorts data and exports only non-sensitive settings', () => {
    const b = buildBundle(
      {
        periodDays,
        dayLogs,
        symptoms,
        settings: { ...SETTINGS_DEFAULTS, app_lock_enabled: true, estimated_cycle_length: 30 },
      },
      now,
    );
    expect(b.periodDays.map((p) => p.date)).toEqual(['2026-03-01', '2026-03-02']);
    expect(b.settings).toEqual({
      estimated_cycle_length: 30,
      estimated_period_length: null,
      cycles_irregular: false,
      goals: [],
    });
    expect('app_lock_enabled' in b.settings).toBe(false);
    expect(b.exportedAt).toBe('2026-03-15T12:00:00.000Z');
    expect(JSON.parse(toJson(b))).toEqual(b);
  });
});

describe('toCsv', () => {
  it('writes one row per day with escaped cells', () => {
    const csv = toCsv(
      buildBundle({ periodDays, dayLogs, symptoms, settings: SETTINGS_DEFAULTS }, now),
    );
    expect(csv.split('\n')).toEqual(
      [
        'date,period_flow,mood,symptoms,notes',
        '2026-03-01,light,,,',
        '2026-03-02,heavy,low,"Cramps; Night ""sweats"", bad","line one\nline two"'.replace(
          '\nline',
          '\nline',
        ),
        '2026-03-10,,,Cramps,',
        '',
      ].flatMap((l) => l.split('\n')),
    );
  });
  it('handles an empty export', () => {
    expect(
      toCsv(
        buildBundle(
          { periodDays: [], dayLogs: [], symptoms: [], settings: SETTINGS_DEFAULTS },
          now,
        ),
      ),
    ).toBe('date,period_flow,mood,symptoms,notes\n');
  });
});
