import { createRepositories, openDatabase, type Repositories } from '@/db';
import { track } from '@/services/analytics';
import { initializeLock, useSettingsStore } from '@/store';

let repos: Repositories | null = null;

/** Opens the encrypted DB, hydrates settings, and arms the app lock. Idempotent. */
export async function bootstrap(): Promise<Repositories> {
  if (repos) return repos;
  const db = await openDatabase();
  repos = createRepositories(db);
  await useSettingsStore.getState().hydrate(repos.settings);
  initializeLock(useSettingsStore.getState().values.app_lock_enabled);
  track('app_open');
  return repos;
}

export function getRepos(): Repositories {
  if (!repos) throw new Error('bootstrap() has not completed');
  return repos;
}

/** For "delete everything": forget repositories so the next boot re-opens fresh. */
export function resetBootstrap(): void {
  repos = null;
  useSettingsStore.getState().reset();
}
