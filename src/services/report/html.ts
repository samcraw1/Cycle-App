import type { Period } from '@/domain/cycles';
import { daysBetween, type IsoDate } from '@/domain/dates';
import { PHASE_COPY, type CycleStats, type PhaseBreakdown } from '@/domain/insights';
import type { ExportBundle } from '@/services/export';

export interface ReportInput {
  bundle: ExportBundle;
  periods: readonly Period[];
  stats: CycleStats;
  byPhase: readonly PhaseBreakdown[];
  /** Include daily logs on/after this date. */
  logsSince: IsoDate;
  generatedOn: IsoDate;
  appVersion: string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DISCLAIMER =
  'This report is a summary of self-logged data from the Cycle app. It is not a medical record, diagnosis, or advice. Cycle phases are estimates based on average cycle timing.';

const fmt = (n: number | null, unit = '') => (n === null ? '–' : `${n}${unit}`);

/** Self-contained HTML for a printable, doctor-ready summary. */
export function buildReportHtml(input: ReportInput): string {
  const { bundle, periods, stats, byPhase, logsSince, generatedOn, appVersion } = input;
  const labels = new Map(bundle.symptoms.map((s) => [s.id, s.label]));
  const name = (id: string) => escapeHtml(labels.get(id) ?? id);
  const flowByDate = new Map(bundle.periodDays.map((p) => [p.date, p.flow]));

  const sortedPeriods = [...periods].sort((a, b) => (a.start < b.start ? -1 : 1));
  const cycleRows = sortedPeriods
    .map((p, i) => {
      const next = sortedPeriods[i + 1];
      const cycleLen = next ? daysBetween(p.start, next.start) : null;
      return `<tr><td>${p.start}</td><td>${p.end}</td><td>${p.length}</td><td>${cycleLen ?? 'in progress'}</td></tr>`;
    })
    .reverse()
    .join('');

  const phaseRows = byPhase
    .map((b) => {
      const top = b.top.length
        ? b.top.map((t) => `${name(t.symptomId)} (${Math.round(t.share * 100)}%)`).join(', ')
        : '—';
      return `<tr><td>${escapeHtml(PHASE_COPY[b.phase])}</td><td>${b.loggedDays}</td><td>${top}</td></tr>`;
    })
    .join('');

  const logDates = new Set<string>();
  for (const l of bundle.dayLogs) if (l.date >= logsSince) logDates.add(l.date);
  for (const p of bundle.periodDays) if (p.date >= logsSince) logDates.add(p.date);
  const logsByDate = new Map(bundle.dayLogs.map((l) => [l.date, l]));
  const logRows = [...logDates]
    .sort()
    .reverse()
    .map((date) => {
      const log = logsByDate.get(date as IsoDate);
      const flow = flowByDate.get(date as IsoDate) ?? '';
      const symptoms = log?.symptomIds.map(name).join(', ') ?? '';
      return `<tr><td>${date}</td><td>${escapeHtml(flow)}</td><td>${escapeHtml(log?.mood ?? '')}</td><td>${symptoms}</td><td>${escapeHtml(log?.notes ?? '')}</td></tr>`;
    })
    .join('');

  const firstDate = sortedPeriods[0]?.start ?? null;

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Cycle report</title>
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1c1917; margin: 36px; font-size: 12px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; border-bottom: 1px solid #d9cec2; padding-bottom: 4px; }
  .muted { color: #5c534b; }
  .disclaimer { background: #f6f1ec; border-radius: 8px; padding: 10px 12px; margin: 12px 0 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid #ebe3da; vertical-align: top; }
  th { background: #faf7f3; font-weight: 600; }
  .stats { display: flex; gap: 24px; flex-wrap: wrap; }
  .stat b { display: block; font-size: 18px; }
</style></head><body>
<h1>Cycle report</h1>
<div class="muted">Generated ${generatedOn}${firstDate ? ` · Data from ${firstDate}` : ''} · Cycle app ${escapeHtml(appVersion)}</div>
<p class="disclaimer">${DISCLAIMER}</p>

<h2>Summary</h2>
<div class="stats">
  <div class="stat"><b>${stats.count}</b>cycles logged</div>
  <div class="stat"><b>${fmt(stats.average)}</b>avg cycle length (days)</div>
  <div class="stat"><b>${fmt(stats.variability, '')}</b>std. deviation (days)</div>
  <div class="stat"><b>${fmt(stats.shortest)}–${fmt(stats.longest)}</b>shortest–longest</div>
  <div class="stat"><b>${fmt(stats.averagePeriodLength)}</b>avg period length (days)</div>
</div>

<h2>Period history</h2>
<table><thead><tr><th>Period start</th><th>Period end</th><th>Period days</th><th>Cycle length</th></tr></thead>
<tbody>${cycleRows || '<tr><td colspan="4" class="muted">No periods logged.</td></tr>'}</tbody></table>

<h2>Symptoms by estimated cycle phase</h2>
<table><thead><tr><th>Phase</th><th>Days logged</th><th>Most frequent symptoms (share of logged days)</th></tr></thead>
<tbody>${phaseRows}</tbody></table>

<h2>Daily log since ${logsSince}</h2>
<table><thead><tr><th>Date</th><th>Flow</th><th>Mood</th><th>Symptoms</th><th>Notes</th></tr></thead>
<tbody>${logRows || '<tr><td colspan="5" class="muted">Nothing logged in this window.</td></tr>'}</tbody></table>
</body></html>`;
}
