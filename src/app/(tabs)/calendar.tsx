import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { DISCLAIMER_SHORT } from '@/content/copy';
import { dateRange, today } from '@/domain/dates';
import { summarizeCycles, useCycleStore, useSettingsStore } from '@/store';
import { MonthGrid, Screen, Text, type DayMarker } from '@/ui/components';
import { useTheme } from '@/ui/theme';

export default function CalendarScreen() {
  const { colors, spacing } = useTheme();
  const now = today();
  const [month, setMonth] = useState(now);
  const periodDays = useCycleStore((s) => s.periodDays);
  const dayLogs = useCycleStore((s) => s.dayLogs);
  const settings = useSettingsStore((s) => s.values);

  const summary = useMemo(
    () => summarizeCycles(periodDays, settings, now),
    [periodDays, settings, now],
  );

  const markers = useMemo(() => {
    const m: Record<string, DayMarker> = {};
    const p = summary.prediction;
    if (p && !p.isOverdue) {
      for (const d of dateRange(p.earliest, p.latest)) m[d] = { predicted: true };
    }
    for (const pd of periodDays) m[pd.date] = { ...m[pd.date], flow: pd.flow };
    for (const log of Object.values(dayLogs)) {
      if (log.symptomIds.length)
        m[log.date] = { ...m[log.date], symptomCount: log.symptomIds.length };
    }
    return m;
  }, [periodDays, dayLogs, summary.prediction]);

  return (
    <Screen scroll>
      <MonthGrid
        month={month}
        today={now}
        markers={markers}
        maxDate={now}
        onSelectDay={(d) => router.push(`/log/${d}`)}
        onChangeMonth={setMonth}
      />

      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg }}
        accessibilityRole="summary"
      >
        <Legend color={colors.period} label="Period" />
        <Legend color={colors.predictedSoft} label="Predicted range" border={colors.predicted} />
        <Legend color={colors.info} label="Symptoms logged" small />
      </View>

      <Text variant="caption" muted style={{ marginTop: spacing.lg }}>
        {DISCLAIMER_SHORT}
      </Text>
    </Screen>
  );
}

function Legend({
  color,
  label,
  border,
  small,
}: {
  color: string;
  label: string;
  border?: string;
  small?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: small ? 6 : 14,
          height: small ? 6 : 14,
          borderRadius: 7,
          backgroundColor: color,
          borderWidth: border ? 1 : 0,
          borderColor: border,
        }}
      />
      <Text variant="caption" muted>
        {label}
      </Text>
    </View>
  );
}
