import { endOfMonth, getDay, startOfMonth } from 'date-fns';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Flow } from '@/db';
import { addDays, fromIsoDate, toIsoDate, type IsoDate } from '@/domain/dates';
import { formatA11yDate, formatMonth } from '@/ui/format';
import { useTheme } from '@/ui/theme';

import { Text } from './Text';

export interface DayMarker {
  flow?: Flow;
  predicted?: boolean;
  symptomCount?: number;
}

export interface MonthGridProps {
  /** Any date inside the month to display. */
  month: IsoDate;
  today: IsoDate;
  markers?: Readonly<Record<string, DayMarker>>;
  selected?: IsoDate | null;
  /** Days after this are disabled (e.g. no future logging). */
  maxDate?: IsoDate;
  onSelectDay(date: IsoDate): void;
  onChangeMonth?(next: IsoDate): void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function MonthGrid({
  month,
  today,
  markers = {},
  selected = null,
  maxDate,
  onSelectDay,
  onChangeMonth,
}: MonthGridProps) {
  const { colors, radius, spacing } = useTheme();

  const cells = useMemo(() => {
    const first = toIsoDate(startOfMonth(fromIsoDate(month)));
    const last = toIsoDate(endOfMonth(fromIsoDate(month)));
    const lead = getDay(fromIsoDate(first));
    const out: (IsoDate | null)[] = Array.from({ length: lead }, () => null);
    let d = first;
    while (d <= last) {
      out.push(d);
      d = addDays(d, 1);
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [month]);

  const prevMonth = toIsoDate(startOfMonth(addDaysDate(fromIsoDate(month), -1)));
  const nextMonth = toIsoDate(addDaysDate(endOfMonth(fromIsoDate(month)), 1));

  return (
    <View accessibilityRole="none">
      {onChangeMonth ? (
        <View style={[styles.header, { marginBottom: spacing.sm }]}>
          <NavButton label="Previous month" glyph="‹" onPress={() => onChangeMonth(prevMonth)} />
          <Text variant="heading" accessibilityRole="header">
            {formatMonth(month)}
          </Text>
          <NavButton label="Next month" glyph="›" onPress={() => onChangeMonth(nextMonth)} />
        </View>
      ) : (
        <Text
          variant="heading"
          accessibilityRole="header"
          style={{ textAlign: 'center', marginBottom: spacing.sm }}
        >
          {formatMonth(month)}
        </Text>
      )}

      <View style={styles.row}>
        {WEEKDAYS.map((w, i) => (
          <Text
            key={WEEKDAY_NAMES[i]}
            variant="caption"
            muted
            accessibilityLabel={WEEKDAY_NAMES[i]}
            style={styles.weekday}
          >
            {w}
          </Text>
        ))}
      </View>

      {chunk(cells, 7).map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((date, di) => {
            if (!date) return <View key={`e${di}`} style={styles.cell} />;
            const m = markers[date];
            const disabled = Boolean(maxDate && date > maxDate);
            const isToday = date === today;
            const isSelected = date === selected;
            const bg = m?.flow
              ? colors.period
              : m?.predicted
                ? colors.predictedSoft
                : 'transparent';
            const fg = m?.flow ? colors.onAccent : disabled ? colors.textMuted : colors.text;
            const parts = [formatA11yDate(date)];
            if (isToday) parts.push('today');
            if (m?.flow) parts.push(`period, ${m.flow} flow`);
            else if (m?.predicted) parts.push('predicted period');
            if (m?.symptomCount)
              parts.push(`${m.symptomCount} symptom${m.symptomCount === 1 ? '' : 's'} logged`);
            return (
              <Pressable
                key={date}
                disabled={disabled}
                onPress={() => onSelectDay(date)}
                accessibilityRole="button"
                accessibilityLabel={parts.join(', ')}
                accessibilityState={{ disabled, selected: isSelected }}
                style={[styles.cell, { opacity: disabled ? 0.55 : 1 }]}
              >
                <View
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: bg,
                      borderRadius: radius.pill,
                      borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                      borderColor: isSelected ? colors.accent : colors.text,
                    },
                  ]}
                >
                  <Text variant="body" color={fg} style={{ fontWeight: isToday ? '700' : '400' }}>
                    {Number(date.slice(8, 10))}
                  </Text>
                  <View style={styles.dots}>
                    {Array.from({ length: Math.min(3, m?.symptomCount ?? 0) }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          { backgroundColor: m?.flow ? colors.onAccent : colors.info },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function NavButton({ label, glyph, onPress }: { label: string; glyph: string; onPress(): void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.nav}
    >
      <Text variant="title" color={colors.accent}>
        {glyph}
      </Text>
    </Pressable>
  );
}

function addDaysDate(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function chunk<T>(xs: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', paddingVertical: 4 },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  dayCircle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', position: 'absolute', bottom: 3, gap: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
