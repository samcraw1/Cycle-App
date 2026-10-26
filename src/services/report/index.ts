import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { Repositories } from '@/db';
import { derivePeriods } from '@/domain/cycles';
import { addDays, today } from '@/domain/dates';
import { cycleStats, symptomsByPhase } from '@/domain/insights';
import { DEFAULT_CYCLE_LENGTH, predictNextPeriod } from '@/domain/prediction';
import { collectBundle } from '@/services/export';

import { buildReportHtml } from './html';

export * from './html';

export const REPORT_LOG_WINDOW_DAYS = 90;
const PRINT_TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out. Please try again.`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

/** Builds the PDF in the app cache and opens the share sheet. Premium only (gated by caller). */
export async function shareDoctorReport(repos: Repositories): Promise<'shared' | 'unavailable'> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  const bundle = await collectBundle(repos);
  const now = today();
  const periods = derivePeriods(bundle.periodDays);
  const stats = cycleStats(periods);
  const prediction = predictNextPeriod({ periodStarts: periods.map((p) => p.start), today: now });
  const expected = Math.round(prediction?.averageCycleLength ?? DEFAULT_CYCLE_LENGTH);
  const html = buildReportHtml({
    bundle,
    periods,
    stats,
    byPhase: symptomsByPhase(bundle.dayLogs, periods, expected, 3),
    logsSince: addDays(now, -REPORT_LOG_WINDOW_DAYS),
    generatedOn: now,
    appVersion: Constants.expoConfig?.version ?? '',
  });
  const { uri } = await withTimeout(
    Print.printToFileAsync({ html }),
    PRINT_TIMEOUT_MS,
    'Building the PDF',
  );
  // expo-print names the file with a UUID; give the user something readable.
  const named = new File(Paths.cache, `cycle-report-${now}.pdf`);
  if (named.exists) named.delete();
  new File(uri).copy(named);
  await Sharing.shareAsync(named.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Share report',
  });
  return 'shared';
}
