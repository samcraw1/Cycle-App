import * as SQLite from 'expo-sqlite';

import { getOrCreateDbKey, deleteDbKey } from './key';
import { runMigrations } from './migrate';
import { MIGRATIONS } from './migrations';
import type { Db } from './types';

export const DB_NAME = 'cycle.db';

let instance: SQLite.SQLiteDatabase | null = null;

export class EncryptionUnavailableError extends Error {
  constructor() {
    super('SQLCipher is not compiled into this build; refusing to store health data unencrypted.');
    this.name = 'EncryptionUnavailableError';
  }
}

async function applyKey(db: SQLite.SQLiteDatabase, hexKey: string): Promise<void> {
  // Raw 256-bit key (x'..') skips SQLCipher's KDF, so opening is fast and the
  // strength comes from the Keychain-stored random key, not a password.
  await db.execAsync(`PRAGMA key = "x'${hexKey}'"`);
  const row = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
  if (!row?.cipher_version) {
    // Expo Go and non-SQLCipher builds silently ignore PRAGMA key.
    if (!__DEV__) throw new EncryptionUnavailableError();
    console.warn('[db] SQLCipher missing: running UNENCRYPTED. Use a dev build with useSQLCipher.');
  }
}

/** Opens (and migrates) the encrypted database. Safe to call repeatedly. */
export async function openDatabase(): Promise<Db> {
  if (instance) return instance;
  const key = await getOrCreateDbKey();
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    await applyKey(db, key);
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await runMigrations(db, MIGRATIONS);
  } catch (err) {
    await db.closeAsync().catch(() => undefined);
    throw err;
  }
  instance = db;
  return db;
}

export function getDatabase(): Db {
  if (!instance) throw new Error('Database not opened. Call openDatabase() at app boot.');
  return instance;
}

export async function closeDatabase(): Promise<void> {
  if (!instance) return;
  await instance.closeAsync();
  instance = null;
}

/**
 * "Delete everything": closes the DB, removes the file, and destroys the key.
 * Irreversible. The caller is responsible for user confirmation.
 */
export async function destroyDatabase(): Promise<void> {
  await closeDatabase();
  await SQLite.deleteDatabaseAsync(DB_NAME);
  await deleteDbKey();
}
