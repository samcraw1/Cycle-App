import { SETTINGS_DEFAULTS, type DayLog, type PeriodDay, type Symptom } from '@/db/repositories';
import { derivePeriods } from '@/domain/cycles';
import { addDays, asIsoDate, dateRange } from '@/domain/dates';
import { cycleStats, symptomsByPhase } from '@/domain/insights';
import { buildBundle } from '@/services/export/bundle';

import { buildReportHtml, escapeHtml } from '../html';

const d = asIsoDate;
const symptoms: Symptom[] = [
  {
    id: 'cramps',
    label: 'Cramps',
    category: 'physical',
    isCustom: false,
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'c1',
    label: '<b>bold</b> & "quoted"',
    category: 'other',
    isCustom: true,
    isActive: true,
    sortOrder: 1,
  },
];
const pd = (start: string, len: number): PeriodDay[] =>
  dateRange(d(start), addDays(d(start), len - 1)).map((date) => ({
    date,
    flow: 'medium' as const,
  }));
const periodDays = [...pd('2026-08-03', 5), ...pd('2026-09-01', 4), ...pd('2026-09-30', 5)];
const dayLogs: DayLog[] = [
  { date: d('2026-09-02'), mood: 'low', notes: 'note <script>', symptomIds: ['cramps', 'c1'] },
  { date: d('2026-09-20'), mood: null, notes: null, symptomIds: ['cramps'] },
];

function render() {
  const bundle = buildBundle(
    { periodDays, dayLogs, symptoms, settings: SETTINGS_DEFAULTS },
    new Date('2026-10-26T12:00:00Z'),
  );
  const periods = derivePeriods(periodDays);
  return buildReportHtml({
    bundle,
    periods,
    stats: cycleStats(periods),
    byPhase: symptomsByPhase(dayLogs, periods, 29, 3),
    logsSince: d('2026-07-28'),
    generatedOn: d('2026-10-26'),
    appVersion: '0.1.0',
  });
}

describe('buildReportHtml', () => {
  it('escapes user content', () => {
    expect(escapeHtml(`<a href="x">Tom's & Jerry</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom&#39;s &amp; Jerry&lt;/a&gt;',
    );
    const html = render();
    expect(html).not.toContain('<script>');
    expect(html).toContain('note &lt;script&gt;');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt; &amp; &quot;quoted&quot;');
  });
  it('includes summary, cycle rows, phases, logs, and disclaimer', () => {
    const html = render();
    expect(html).toContain('<b>2</b>cycles logged');
    expect(html).toContain('<b>29</b>avg cycle length');
    expect(html).toContain(
      '<tr><td>2026-09-30</td><td>2026-10-04</td><td>5</td><td>in progress</td></tr>',
    );
    expect(html).toContain('<tr><td>2026-09-01</td><td>2026-09-04</td><td>4</td><td>29</td></tr>');
    expect(html).toContain('<td>Period</td><td>1</td><td>');
    expect(html).toContain('Cramps (100%)');
    expect(html).toContain('<td>2026-09-20</td><td></td><td></td><td>Cramps</td><td></td>');
    expect(html).toContain('not a medical record');
    expect(html).toContain('Generated 2026-10-26 · Data from 2026-08-03');
  });
  it('handles an empty dataset', () => {
    const bundle = buildBundle({
      periodDays: [],
      dayLogs: [],
      symptoms: [],
      settings: SETTINGS_DEFAULTS,
    });
    const html = buildReportHtml({
      bundle,
      periods: [],
      stats: cycleStats([]),
      byPhase: symptomsByPhase([], [], 28),
      logsSince: d('2026-07-28'),
      generatedOn: d('2026-10-26'),
      appVersion: '0.1.0',
    });
    expect(html).toContain('No periods logged.');
    expect(html).toContain('Nothing logged in this window.');
    expect(html).toContain('<b>–</b>avg cycle length');
  });
});
