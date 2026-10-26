import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { CONFIDENCE_COPY, CONFIDENCE_HINT, DISCLAIMER_SHORT } from '@/content/copy';
import { today } from '@/domain/dates';
import { RED_FLAG_COPY } from '@/domain/prediction';
import { getRepos } from '@/services/bootstrap';
import { summarizeCycles, useCycleStore, useSettingsStore } from '@/store';
import { Button, Card, Screen, Text } from '@/ui/components';
import { formatDayLong, formatRange } from '@/ui/format';
import { useTheme } from '@/ui/theme';

export default function HomeScreen() {
  const { colors, radius, spacing } = useTheme();
  const now = today();
  const periodDays = useCycleStore((s) => s.periodDays);
  const todayLog = useCycleStore((s) => s.dayLogs[now]);
  const setPeriodDay = useCycleStore((s) => s.setPeriodDay);
  const settings = useSettingsStore((s) => s.values);

  const summary = useMemo(
    () => summarizeCycles(periodDays, settings, now),
    [periodDays, settings, now],
  );
  const { current, prediction, redFlags } = summary;
  const todayPeriod = periodDays.find((p) => p.date === now);

  const startPeriodToday = () => void setPeriodDay(getRepos(), { date: now, flow: 'medium' });

  return (
    <Screen scroll>
      <Text variant="caption" muted>
        {formatDayLong(now)}
      </Text>
      <Text variant="display" accessibilityRole="header" style={{ marginBottom: spacing.lg }}>
        {current ? `Day ${current.day}` : 'Welcome'}
      </Text>

      {current ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="caption" muted>
            Cycle started {formatRange(current.start, current.start)}
          </Text>
          {todayPeriod ? (
            <Text variant="heading" style={{ marginTop: spacing.xs }}>
              Period day · {todayPeriod.flow}
            </Text>
          ) : null}
        </Card>
      ) : (
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="heading">No period logged yet</Text>
          <Text muted style={{ marginVertical: spacing.sm }}>
            Log your period when it starts and predictions will appear here.
          </Text>
          <Button title="My period started today" onPress={startPeriodToday} />
        </Card>
      )}

      {prediction ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="caption" muted>
            {prediction.isOverdue ? 'Period not logged yet' : 'Next period expected'}
          </Text>
          <Text variant="title" style={{ marginVertical: spacing.xs }}>
            {prediction.isOverdue
              ? `${prediction.daysOverdue} day${prediction.daysOverdue === 1 ? '' : 's'} past the expected range`
              : formatRange(prediction.earliest, prediction.latest)}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}
          >
            <View
              style={{
                backgroundColor: colors.accentSoft,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
              }}
            >
              <Text variant="caption" color={colors.accent}>
                {CONFIDENCE_COPY[prediction.confidence]}
              </Text>
            </View>
            <Text variant="caption" muted style={{ flex: 1 }}>
              {prediction.isOverdue
                ? 'Longer cycles happen. Log it when it starts.'
                : CONFIDENCE_HINT[prediction.confidence]}
            </Text>
          </View>
          <Text variant="caption" muted>
            {DISCLAIMER_SHORT}
          </Text>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        {current && !todayPeriod ? (
          <Button title="Period started" variant="secondary" onPress={startPeriodToday} />
        ) : null}
        <Button
          title={todayLog || todayPeriod ? 'Edit today' : 'Log today'}
          onPress={() => router.push('/log/today')}
        />
      </View>

      {todayLog ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="caption" muted>
            Today
          </Text>
          <Text>
            {[
              todayLog.mood ? `Mood: ${todayLog.mood}` : null,
              todayLog.symptomIds.length
                ? `${todayLog.symptomIds.length} symptom${todayLog.symptomIds.length === 1 ? '' : 's'}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Notes only'}
          </Text>
        </Card>
      ) : null}

      {redFlags.map((flag) => (
        <Card key={flag} style={{ marginBottom: spacing.md, backgroundColor: colors.surfaceAlt }}>
          <Text variant="label" style={{ marginBottom: spacing.xs }}>
            Something to consider
          </Text>
          <Text variant="caption">{RED_FLAG_COPY[flag]}</Text>
        </Card>
      ))}
    </Screen>
  );
}
