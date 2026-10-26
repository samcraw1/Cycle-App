import { asIsoDate } from '@/domain/dates';

import { runMigrations } from '../migrate';
import { MIGRATIONS } from '../migrations';
import { createRepositories, type Repositories } from '../repositories';
import { createTestDb } from './testDb';

const d = asIsoDate;
let repos: Repositories;

beforeEach(async () => {
  const db = createTestDb();
  await runMigrations(db, MIGRATIONS);
  repos = createRepositories(db);
});

describe('settingsRepo', () => {
  it('returns defaults for unset keys', async () => {
    expect(await repos.settings.get('app_lock_enabled')).toBe(false);
    expect(await repos.settings.get('reminder_daily_log_time')).toBe('20:00');
    expect(await repos.settings.get('estimated_cycle_length')).toBeNull();
  });
  it('round-trips typed values and overwrites', async () => {
    await repos.settings.set('estimated_cycle_length', 31);
    await repos.settings.set('goals', ['understand_patterns', 'track_symptoms']);
    expect(await repos.settings.get('estimated_cycle_length')).toBe(31);
    await repos.settings.set('estimated_cycle_length', null);
    expect(await repos.settings.get('estimated_cycle_length')).toBeNull();
    const all = await repos.settings.getAll();
    expect(all.goals).toEqual(['understand_patterns', 'track_symptoms']);
    expect(all.onboarding_complete).toBe(false);
  });
});

describe('periodDaysRepo', () => {
  it('upserts, lists in order, and removes', async () => {
    await repos.periodDays.upsert({ date: d('2026-03-03'), flow: 'light' });
    await repos.periodDays.upsert({ date: d('2026-03-01'), flow: 'medium' });
    await repos.periodDays.upsert({ date: d('2026-03-01'), flow: 'heavy' });
    expect(await repos.periodDays.listAll()).toEqual([
      { date: '2026-03-01', flow: 'heavy' },
      { date: '2026-03-03', flow: 'light' },
    ]);
    expect(await repos.periodDays.listBetween(d('2026-03-02'), d('2026-03-31'))).toHaveLength(1);
    await repos.periodDays.remove(d('2026-03-01'));
    expect(await repos.periodDays.get(d('2026-03-01'))).toBeNull();
  });
});

describe('dayLogsRepo', () => {
  it('saves mood, notes, and symptoms together', async () => {
    await repos.dayLogs.save({
      date: d('2026-03-05'),
      mood: 'low',
      notes: 'rough night',
      symptomIds: ['cramps', 'fatigue'],
    });
    expect(await repos.dayLogs.get(d('2026-03-05'))).toEqual({
      date: '2026-03-05',
      mood: 'low',
      notes: 'rough night',
      symptomIds: ['cramps', 'fatigue'],
    });
  });
  it('replaces symptoms on re-save and deletes empty logs', async () => {
    await repos.dayLogs.save({
      date: d('2026-03-05'),
      mood: 'okay',
      notes: null,
      symptomIds: ['cramps'],
    });
    await repos.dayLogs.save({
      date: d('2026-03-05'),
      mood: null,
      notes: null,
      symptomIds: ['acne'],
    });
    expect((await repos.dayLogs.get(d('2026-03-05')))?.symptomIds).toEqual(['acne']);
    await repos.dayLogs.save({ date: d('2026-03-05'), mood: null, notes: null, symptomIds: [] });
    expect(await repos.dayLogs.get(d('2026-03-05'))).toBeNull();
  });
  it('rejects unknown symptom ids (FK)', async () => {
    await expect(
      repos.dayLogs.save({ date: d('2026-03-05'), mood: null, notes: null, symptomIds: ['bogus'] }),
    ).rejects.toThrow();
    expect(await repos.dayLogs.get(d('2026-03-05'))).toBeNull();
  });
  it('lists a range, merging symptom-only days', async () => {
    await repos.dayLogs.save({ date: d('2026-03-01'), mood: 'good', notes: null, symptomIds: [] });
    await repos.dayLogs.save({
      date: d('2026-03-02'),
      mood: null,
      notes: null,
      symptomIds: ['bloating'],
    });
    const list = await repos.dayLogs.listBetween(d('2026-03-01'), d('2026-03-31'));
    expect(list.map((l) => l.date)).toEqual(['2026-03-01', '2026-03-02']);
    expect(list[1]?.symptomIds).toEqual(['bloating']);
  });
});

describe('symptomsRepo', () => {
  it('lists seeded symptoms and manages custom ones', async () => {
    const before = await repos.symptoms.listActive();
    expect(before.some((s) => s.id === 'cramps' && !s.isCustom)).toBe(true);

    const custom = await repos.symptoms.addCustom('  Night sweats ', 'physical');
    expect(custom.label).toBe('Night sweats');
    expect(custom.isCustom).toBe(true);
    expect((await repos.symptoms.listActive()).at(-1)?.id).toBe(custom.id);

    await repos.symptoms.setActive(custom.id, false);
    expect((await repos.symptoms.listActive()).some((s) => s.id === custom.id)).toBe(false);

    await repos.symptoms.deleteCustom('cramps');
    expect((await repos.symptoms.listAll()).some((s) => s.id === 'cramps')).toBe(true);
    await repos.symptoms.deleteCustom(custom.id);
    expect((await repos.symptoms.listAll()).some((s) => s.id === custom.id)).toBe(false);
  });
});
