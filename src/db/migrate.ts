import type { Db } from './types';

export interface Migration {
  /** Monotonically increasing, starting at 1. */
  version: number;
  name: string;
  up(db: Db): Promise<void>;
}

export async function getSchemaVersion(db: Db): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

export function validateMigrations(migrations: readonly Migration[]): void {
  migrations.forEach((m, i) => {
    if (m.version !== i + 1) {
      throw new Error(`Migration ${m.name} has version ${m.version}, expected ${i + 1}`);
    }
  });
}

/**
 * Applies every migration newer than the stored schema version, each in its
 * own transaction, bumping `PRAGMA user_version` as it goes.
 * Returns the list of migration names applied.
 */
export async function runMigrations(db: Db, migrations: readonly Migration[]): Promise<string[]> {
  validateMigrations(migrations);
  const current = await getSchemaVersion(db);
  const applied: string[] = [];

  for (const migration of migrations) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    applied.push(migration.name);
  }
  return applied;
}
