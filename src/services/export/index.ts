import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { destroyDatabase, type Repositories } from '@/db';
import { asIsoDate } from '@/domain/dates';
import { bootstrap, resetBootstrap } from '@/services/bootstrap';
import { cancelAllReminders } from '@/services/notifications';
import { useSettingsStore } from '@/store';

import { buildBundle, toCsv, toJson, type ExportBundle } from './bundle';

export * from './bundle';

export type ExportFormat = 'json' | 'csv';

export async function collectBundle(repos: Repositories): Promise<ExportBundle> {
  const [periodDays, dayLogs, symptoms] = await Promise.all([
    repos.periodDays.listAll(),
    repos.dayLogs.listBetween(asIsoDate('2000-01-01'), asIsoDate('2100-12-31')),
    repos.symptoms.listAll(),
  ]);
  return buildBundle({
    periodDays,
    dayLogs,
    symptoms,
    settings: useSettingsStore.getState().values,
  });
}

/**
 * Writes the export to the app cache and opens the system share sheet.
 * The user chooses where it goes; nothing is uploaded by the app.
 */
export async function shareExport(
  repos: Repositories,
  format: ExportFormat,
): Promise<'shared' | 'unavailable'> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  const bundle = await collectBundle(repos);
  const stamp = bundle.exportedAt.slice(0, 10);
  const file = new File(Paths.cache, `cycle-export-${stamp}.${format}`);
  if (file.exists) file.delete();
  file.create();
  await file.write(format === 'json' ? toJson(bundle) : toCsv(bundle));
  await Sharing.shareAsync(file.uri, {
    mimeType: format === 'json' ? 'application/json' : 'text/csv',
    UTI: format === 'json' ? 'public.json' : 'public.comma-separated-values-text',
    dialogTitle: 'Export your data',
  });
  return 'shared';
}

/**
 * Deletes everything: reminders, the encrypted database file, and its key,
 * then re-creates an empty database so the app can restart at onboarding.
 */
export async function deleteAllData(): Promise<void> {
  await cancelAllReminders().catch(() => undefined);
  await destroyDatabase();
  resetBootstrap();
  await bootstrap();
}
