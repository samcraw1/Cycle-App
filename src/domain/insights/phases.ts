import type { DayLog } from '@/db';
import type { Period } from '@/domain/cycles';
import { daysBetween, type IsoDate } from '@/domain/dates';

export type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
export const PHASES: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

export const PHASE_COPY: Record<Phase, string> = {
  menstrual: 'Period',
  follicular: 'Follicular',
  ovulatory: 'Around ovulation',
  luteal: 'Luteal',
};

const DEFAULT_LUTEAL_DAYS = 14;
const OVULATORY_HALF_WINDOW = 2;

/**
 * Rough phase estimate for a day inside a cycle. Ovulation is assumed 14 days
 * before the NEXT period start; for the current (open) cycle it uses the
 * expected length. These are population averages, labelled as estimates in UI.
 */
export function phaseForDay(date: IsoDate, period: Period, cycleLength: number): Phase | null {
  const day = daysBetween(period.start, date) + 1;
  if (day < 1 || day > cycleLength) return null;
  if (date <= period.end) return 'menstrual';
  const ovulationDay = Math.max(period.length + 1, cycleLength - DEFAULT_LUTEAL_DAYS);
  if (Math.abs(day - ovulationDay) <= OVULATORY_HALF_WINDOW) return 'ovulatory';
  return day < ovulationDay ? 'follicular' : 'luteal';
}

export interface SymptomPhaseCount {
  symptomId: string;
  count: number;
  /** Share of logged days in this phase that included the symptom, 0..1. */
  share: number;
}

export interface PhaseBreakdown {
  phase: Phase;
  loggedDays: number;
  top: SymptomPhaseCount[];
}

/**
 * Top symptoms per cycle phase, computed only from days that fall inside a
 * known cycle. Days before the first period are ignored.
 */
export function symptomsByPhase(
  logs: readonly DayLog[],
  periods: readonly Period[],
  expectedCycleLength: number,
  topN = 3,
): PhaseBreakdown[] {
  const sorted = [...periods].sort((a, b) => (a.start < b.start ? -1 : 1));
  const counts = new Map<Phase, Map<string, number>>();
  const days = new Map<Phase, number>();
  for (const p of PHASES) {
    counts.set(p, new Map());
    days.set(p, 0);
  }

  for (const log of logs) {
    if (log.symptomIds.length === 0) continue;
    const idx = findPeriodIndex(sorted, log.date);
    if (idx === -1) continue;
    const period = sorted[idx]!;
    const next = sorted[idx + 1];
    const cycleLength = next ? daysBetween(period.start, next.start) : expectedCycleLength;
    const phase = phaseForDay(log.date, period, cycleLength);
    if (!phase) continue;
    days.set(phase, (days.get(phase) ?? 0) + 1);
    const bucket = counts.get(phase)!;
    for (const id of log.symptomIds) bucket.set(id, (bucket.get(id) ?? 0) + 1);
  }

  return PHASES.map((phase) => {
    const loggedDays = days.get(phase) ?? 0;
    const top = [...counts.get(phase)!.entries()]
      .map(([symptomId, count]) => ({
        symptomId,
        count,
        share: loggedDays ? count / loggedDays : 0,
      }))
      .sort((a, b) => b.count - a.count || a.symptomId.localeCompare(b.symptomId))
      .slice(0, topN);
    return { phase, loggedDays, top };
  });
}

/** Index of the last period whose start is on or before `date`. */
function findPeriodIndex(sorted: readonly Period[], date: IsoDate): number {
  let idx = -1;
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i]!.start <= date) idx = i;
    else break;
  }
  return idx;
}

export interface SymptomFrequency {
  symptomId: string;
  count: number;
}

/** Overall most-logged symptoms (free tier). */
export function topSymptoms(logs: readonly DayLog[], topN = 5): SymptomFrequency[] {
  const counts = new Map<string, number>();
  for (const log of logs)
    for (const id of log.symptomIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([symptomId, count]) => ({ symptomId, count }))
    .sort((a, b) => b.count - a.count || a.symptomId.localeCompare(b.symptomId))
    .slice(0, topN);
}
