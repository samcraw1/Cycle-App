import { DatabaseSync } from 'node:sqlite';

import type { Db, SqlParam } from '../types';

/**
 * In-memory SQLite backed by Node's built-in `node:sqlite`, exposing the same
 * `Db` surface the app uses. Lets repositories and migrations run real SQL in
 * Jest without native Expo modules.
 */
export function createTestDb(): Db & { raw: DatabaseSync } {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON');
  let depth = 0;
  return {
    raw,
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, ...params: SqlParam[]) {
      const r = raw.prepare(sql).run(...params);
      return { changes: Number(r.changes) };
    },
    async getFirstAsync<T>(sql: string, ...params: SqlParam[]) {
      return (raw.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, ...params: SqlParam[]) {
      return raw.prepare(sql).all(...params) as T[];
    },
    async withTransactionAsync(task) {
      if (depth > 0) {
        await task();
        return;
      }
      depth += 1;
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      } finally {
        depth -= 1;
      }
    },
  };
}
