import { format } from 'date-fns';

import { fromIsoDate, type IsoDate } from '@/domain/dates';

export const formatDay = (d: IsoDate) => format(fromIsoDate(d), 'MMM d');
export const formatDayLong = (d: IsoDate) => format(fromIsoDate(d), 'EEEE, MMMM d');
export const formatMonth = (d: IsoDate) => format(fromIsoDate(d), 'MMMM yyyy');
export const formatA11yDate = (d: IsoDate) => format(fromIsoDate(d), 'EEEE, MMMM d, yyyy');

export function formatRange(a: IsoDate, b: IsoDate): string {
  if (a === b) return formatDay(a);
  const da = fromIsoDate(a);
  const db = fromIsoDate(b);
  if (da.getMonth() === db.getMonth()) return `${format(da, 'MMM d')}–${format(db, 'd')}`;
  return `${format(da, 'MMM d')}–${format(db, 'MMM d')}`;
}
