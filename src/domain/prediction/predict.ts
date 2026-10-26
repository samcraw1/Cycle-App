import { addDays, daysBetween, maxIsoDate, type IsoDate } from '@/domain/dates';

export type Confidence = 'low' | 'medium' | 'high';

export interface OnboardingEstimate {
  cycleLength: number | null;
  irregular: boolean;
}

export interface PredictionInput {
  /** Period start dates, any order. */
  periodStarts: readonly IsoDate[];
  today: IsoDate;
  estimate?: OnboardingEstimate;
}

export interface Prediction {
  expectedStart: IsoDate;
  earliest: IsoDate;
  latest: IsoDate;
  /** Half-width of the range in days (>= 2). */
  halfWidth: number;
  confidence: Confidence;
  basis: 'history' | 'estimate' | 'default';
  cyclesUsed: number;
  averageCycleLength: number;
  /** Standard deviation of cycles used; 0 when fewer than 2. */
  variability: number;
  /** True when `today` is already past `latest`. */
  isOverdue: boolean;
  daysOverdue: number;
}

export const MIN_CYCLE_DAYS = 15;
export const MAX_CYCLE_DAYS = 90;
export const MAX_CYCLES_USED = 6;
export const DEFAULT_CYCLE_LENGTH = 28;
export const MIN_HALF_WIDTH = 2;
export const MAX_HALF_WIDTH = 14;

export function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function stdDev(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1));
}

/** Recency-weighted mean: weights 1..n, oldest to newest. */
export function weightedMean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    const w = i + 1;
    num += x * w;
    den += w;
  });
  return num / den;
}

/**
 * Removes physiologically implausible cycles, then (with enough data) cycles
 * more than 2 SD from the mean. Outliers stay in history; only the average
 * ignores them.
 */
export function excludeOutliers(lengths: readonly number[]): number[] {
  const plausible = lengths.filter((l) => l >= MIN_CYCLE_DAYS && l <= MAX_CYCLE_DAYS);
  if (plausible.length < 4) return plausible;
  const m = mean(plausible);
  const sd = stdDev(plausible);
  if (sd === 0) return plausible;
  const kept = plausible.filter((l) => Math.abs(l - m) <= 2 * sd);
  return kept.length >= 2 ? kept : plausible;
}

function clampHalfWidth(n: number): number {
  return Math.min(MAX_HALF_WIDTH, Math.max(MIN_HALF_WIDTH, Math.round(n)));
}

/** Resolve the average, spread, and confidence for the available data. */
function resolveModel(
  used: readonly number[],
  estimate: OnboardingEstimate | undefined,
): Pick<Prediction, 'averageCycleLength' | 'halfWidth' | 'confidence' | 'basis' | 'variability'> {
  const n = used.length;
  const est = estimate?.cycleLength ?? null;
  const estValid = est !== null && est >= MIN_CYCLE_DAYS && est <= MAX_CYCLE_DAYS;

  if (n === 0) {
    if (estValid) {
      return {
        averageCycleLength: est,
        halfWidth: estimate?.irregular ? 7 : 4,
        confidence: 'low',
        basis: 'estimate',
        variability: 0,
      };
    }
    return {
      averageCycleLength: DEFAULT_CYCLE_LENGTH,
      halfWidth: 7,
      confidence: 'low',
      basis: 'default',
      variability: 0,
    };
  }

  if (n === 1) {
    const only = used[0]!;
    const avg = estValid ? (only + est) / 2 : only;
    return {
      averageCycleLength: avg,
      halfWidth: estimate?.irregular ? 7 : 4,
      confidence: 'low',
      basis: 'history',
      variability: 0,
    };
  }

  const avg = weightedMean(used);
  const sd = stdDev(used);
  let halfWidth = clampHalfWidth(Math.max(MIN_HALF_WIDTH, sd * 1.5));
  if (estimate?.irregular && n < 4) halfWidth = Math.max(halfWidth, 5);

  let confidence: Confidence;
  if (n < 3 || sd > 5) confidence = 'low';
  else if (n >= 5 && sd <= 2.5) confidence = 'high';
  else confidence = 'medium';

  return { averageCycleLength: avg, halfWidth, confidence, basis: 'history', variability: sd };
}

/**
 * Predicts the next period start as a RANGE with a confidence label.
 * Never returns a bare date: `earliest`/`latest` always bracket `expectedStart`.
 * Returns null only when there is no period start at all to anchor from.
 */
export function predictNextPeriod(input: PredictionInput): Prediction | null {
  const starts = [...input.periodStarts].filter((s) => s <= input.today).sort();
  const lastStart = starts[starts.length - 1];
  if (!lastStart) return null;

  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i += 1) lengths.push(daysBetween(starts[i - 1]!, starts[i]!));
  const recent = lengths.slice(-MAX_CYCLES_USED);
  const used = excludeOutliers(recent);

  const model = resolveModel(used, input.estimate);
  const avgRounded = Math.round(model.averageCycleLength);

  let expectedStart = addDays(lastStart, avgRounded);
  // If the expected date already passed by more than a full range, the user is
  // overdue; keep the anchor honest instead of silently rolling forward.
  const earliest = addDays(expectedStart, -model.halfWidth);
  const latest = addDays(expectedStart, model.halfWidth);
  const isOverdue = input.today > latest;
  const daysOverdue = isOverdue ? daysBetween(latest, input.today) : 0;
  // Cycle already longer than expected: the earliest plausible date is today.
  const earliestShown = isOverdue ? maxIsoDate(earliest, input.today) : earliest;
  if (isOverdue) expectedStart = maxIsoDate(expectedStart, input.today);

  return {
    expectedStart,
    earliest: earliestShown,
    latest: isOverdue ? maxIsoDate(latest, input.today) : latest,
    halfWidth: model.halfWidth,
    confidence: model.confidence,
    basis: model.basis,
    cyclesUsed: used.length,
    averageCycleLength: model.averageCycleLength,
    variability: model.variability,
    isOverdue,
    daysOverdue,
  };
}
