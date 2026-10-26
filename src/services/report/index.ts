import Constants from 'expo-constants';
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
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Share report',
  });
  return 'shared';
}
