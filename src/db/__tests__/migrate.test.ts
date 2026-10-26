import { getSchemaVersion, runMigrations, validateMigrations, type Migration } from '../migrate';
import { MIGRATIONS } from '../migrations';
import { createTestDb } from './testDb';

const mk = (version: number, sql: string): Migration => ({
  version,
  name: `m${version}`,
  up: async (db) => db.execAsync(sql),
});

describe('runMigrations', () => {
  it('applies all migrations on a fresh db and records the version', async () => {
    const db = createTestDb();
    const applied = await runMigrations(db, [
      mk(1, 'CREATE TABLE a (x)'),
      mk(2, 'CREATE TABLE b (y)'),
    ]);
    expect(applied).toEqual(['m1', 'm2']);
    expect(await getSchemaVersion(db)).toBe(2);
  });

  it('is idempotent and only applies newer migrations', async () => {
    const db = createTestDb();
    const list = [mk(1, 'CREATE TABLE a (x)')];
    await runMigrations(db, list);
    const withNew = [...list, mk(2, 'CREATE TABLE b (y)')];
    expect(await runMigrations(db, withNew)).toEqual(['m2']);
    expect(await runMigrations(db, withNew)).toEqual([]);
    expect(await getSchemaVersion(db)).toBe(2);
  });

  it('rolls back a failing migration and does not bump the version', async () => {
    const db = createTestDb();
    const bad = [mk(1, 'CREATE TABLE a (x)'), mk(2, 'CREATE TABLE b (y); THIS IS NOT SQL;')];
    await expect(runMigrations(db, bad)).rejects.toThrow();
    expect(await getSchemaVersion(db)).toBe(1);
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table'",
    );
    expect(tables.map((t) => t.name)).toEqual(['a']);
  });

  it('rejects out-of-order or gapped version numbers', () => {
    expect(() => validateMigrations([mk(1, ''), mk(3, '')])).toThrow(/expected 2/);
    expect(() => validateMigrations([mk(2, '')])).toThrow(/expected 1/);
  });
});

describe('real migrations', () => {
  it('create the expected schema and seed symptoms', async () => {
    const db = createTestDb();
    await runMigrations(db, MIGRATIONS);
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    expect(tables.map((t) => t.name)).toEqual([
      'day_logs',
      'day_symptoms',
      'period_days',
      'settings',
      'symptoms',
    ]);
    const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM symptoms');
    expect(count?.n).toBeGreaterThan(20);
  });

  it('enforce flow and date constraints', async () => {
    const db = createTestDb();
    await runMigrations(db, MIGRATIONS);
    await expect(
      db.runAsync("INSERT INTO period_days VALUES ('2026-01-01', 'torrential')"),
    ).rejects.toThrow();
    await expect(
      db.runAsync("INSERT INTO period_days VALUES ('2026-1-1', 'light')"),
    ).rejects.toThrow();
    await expect(
      db.runAsync("INSERT INTO day_symptoms VALUES ('2026-01-01', 'nonexistent')"),
    ).rejects.toThrow();
  });
});
