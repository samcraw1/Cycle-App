import {
  addDays as dfAddDays,
  differenceInCalendarDays,
  format,
  isValid,
  parse,
  startOfDay,
} from 'date-fns';

/**
 * A local calendar date in `YYYY-MM-DD` form.
 *
 * All health data is keyed by calendar day, never by timestamp, so a period
 * logged on "March 10" stays on March 10 regardless of timezone or DST.
 */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FORMAT = 'yyyy-MM-dd';

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false;
  const parsed = parse(value, FORMAT, new Date());
  return isValid(parsed) && format(parsed, FORMAT) === value;
}

/** Narrow a string to IsoDate, throwing on malformed input. */
export function asIsoDate(value: string): IsoDate {
  if (!isIsoDate(value)) throw new Error(`Invalid calendar date: ${value}`);
  return value;
}

/** Local calendar date of a JS Date (uses the device's local timezone). */
export function toIsoDate(date: Date): IsoDate {
  return format(date, FORMAT) as IsoDate;
}

export function today(now: Date = new Date()): IsoDate {
  return toIsoDate(now);
}

/** Local-midnight Date for an IsoDate. Only for display/arithmetic, never storage. */
export function fromIsoDate(date: IsoDate): Date {
  return startOfDay(parse(date, FORMAT, new Date()));
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return toIsoDate(dfAddDays(fromIsoDate(date), days));
}

/** Whole calendar days from `from` to `to` (positive when `to` is later). DST-safe. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return differenceInCalendarDays(fromIsoDate(to), fromIsoDate(from));
}

/** Lexicographic compare is correct for zero-padded ISO dates. */
export function compareIsoDate(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sortIsoDates(dates: readonly IsoDate[]): IsoDate[] {
  return [...dates].sort(compareIsoDate);
}

export function minIsoDate(a: IsoDate, b: IsoDate): IsoDate {
  return a < b ? a : b;
}

export function maxIsoDate(a: IsoDate, b: IsoDate): IsoDate {
  return a > b ? a : b;
}

/** Inclusive list of dates from `start` to `end`. */
export function dateRange(start: IsoDate, end: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  const n = daysBetween(start, end);
  for (let i = 0; i <= n; i += 1) out.push(addDays(start, i));
  return out;
}
