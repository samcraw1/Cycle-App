import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { DEFAULT_CYCLE_LENGTH } from '@/domain/prediction';
import { today } from '@/domain/dates';
import {
  cycleStats,
  PHASE_COPY,
  PHASES,
  symptomsByPhase,
  topSymptoms,
  VARIABILITY_COPY,
  variabilityLabel,
} from '@/domain/insights';
import { track } from '@/services/analytics';
import { summarizeCycles, useCycleStore, useEntitlementsStore, useSettingsStore } from '@/store';
import { BarChart, Button, Card, Screen, Section, Text } from '@/ui/components';
import { formatDay } from '@/ui/format';
import { useTheme } from '@/ui/theme';

export default function InsightsScreen() {
  const { colors, spacing } = useTheme();
  const now = today();
  const periodDays = useCycleStore((s) => s.periodDays);
  const dayLogs = useCycleStore((s) => s.dayLogs);
  const symptoms = useCycleStore((s) => s.symptoms);
  const settings = useSettingsStore((s) => s.values);
  const premium = useEntitlementsStore((s) => s.premium);

  const summary = useMemo(
    () => summarizeCycles(periodDays, settings, now),
    [periodDays, settings, now],
  );
  const stats = useMemo(() => cycleStats(summary.periods), [summary.periods]);
  const logs = useMemo(() => Object.values(dayLogs), [dayLogs]);
  const overall = useMemo(() => topSymptoms(logs, 5), [logs]);
  const byPhase = useMemo(() => {
    const expected = Math.round(summary.prediction?.averageCycleLength ?? DEFAULT_CYCLE_LENGTH);
    return symptomsByPhase(logs, summary.periods, expected, 3);
  }, [logs, summary.periods, summary.prediction]);
  const label = useMemo(() => new Map(symptoms.map((s) => [s.id, s.label])), [symptoms]);
  const name = (id: string) => label.get(id) ?? id;

  const variability = variabilityLabel(stats.variability);
  const chartData = stats.cycles
    .slice(-8)
    .map((c) => ({ label: formatDay(c.start), value: c.length }));

  return (
    <Screen scroll>
      <Text variant="title" accessibilityRole="header" style={{ marginBottom: spacing.lg }}>
        Insights
      </Text>

      {stats.count === 0 ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text variant="heading">Not enough cycles yet</Text>
          <Text muted style={{ marginTop: spacing.xs }}>
            Insights appear after your second logged period. Keep logging and this screen fills in.
          </Text>
          {stats.averagePeriodLength !== null ? (
            <Text style={{ marginTop: spacing.sm }}>
              Average period length so far: {stats.averagePeriodLength} days
            </Text>
          ) : null}
        </Card>
      ) : (
        <>
          <Section title="Your cycles">
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                <Stat label="Average" value={`${stats.average ?? '–'} days`} />
                <Stat label="Shortest" value={`${stats.shortest ?? '–'}`} />
                <Stat label="Longest" value={`${stats.longest ?? '–'}`} />
              </View>
              <View style={{ marginTop: spacing.md }}>
                <Text variant="label">
                  {variability ? VARIABILITY_COPY[variability] : 'Variability: log one more cycle'}
                </Text>
                {stats.variability !== null ? (
                  <Text variant="caption" muted>
                    Typical swing of about ±{stats.variability} days across {stats.count} cycle
                    {stats.count === 1 ? '' : 's'}.
                  </Text>
                ) : null}
                {stats.averagePeriodLength !== null ? (
                  <Text variant="caption" muted>
                    Periods last about {stats.averagePeriodLength} days.
                  </Text>
                ) : null}
              </View>
            </Card>
          </Section>

          <Section title="Cycle length history">
            <Card>
              <BarChart
                data={chartData}
                {...(stats.average !== null ? { reference: stats.average } : {})}
                accessibilityLabel={`Bar chart of your last ${chartData.length} cycle lengths: ${chartData
                  .map((c) => `${c.label}, ${c.value} days`)
                  .join('; ')}. Dashed line marks the average of ${stats.average} days.`}
              />
              <Text variant="caption" muted style={{ marginTop: spacing.sm }}>
                Dashed line is your average. Bars are labelled by cycle start date.
              </Text>
            </Card>
          </Section>
        </>
      )}

      {overall.length > 0 ? (
        <Section title="Most logged symptoms">
          <Card>
            {overall.map((s, i) => (
              <View
                key={s.symptomId}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                }}
              >
                <Text>
                  {i + 1}. {name(s.symptomId)}
                </Text>
                <Text muted>{s.count}×</Text>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title="Symptoms by cycle phase">
        {premium ? (
          <Card>
            {byPhase.map((p) => (
              <View key={p.phase} style={{ marginBottom: spacing.sm }}>
                <Text variant="label">{PHASE_COPY[p.phase]}</Text>
                {p.top.length === 0 ? (
                  <Text variant="caption" muted>
                    Nothing logged in this phase yet.
                  </Text>
                ) : (
                  p.top.map((t) => (
                    <Text key={t.symptomId} variant="caption">
                      {name(t.symptomId)} · {Math.round(t.share * 100)}% of logged days
                    </Text>
                  ))
                )}
              </View>
            ))}
            <Text variant="caption" muted>
              Phases are estimates from average cycle timing, not measurements. {PHASES.length}{' '}
              phases: period, follicular, around ovulation, luteal.
            </Text>
          </Card>
        ) : (
          <Card style={{ backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }}>
            <Text variant="heading">See which symptoms cluster in each phase</Text>
            <Text muted style={{ marginVertical: spacing.sm }}>
              Premium breaks your logged symptoms down by period, follicular, ovulation, and luteal
              phase, and builds a doctor-ready report.
            </Text>
            <Button
              title="See Premium"
              onPress={() => {
                track('paywall_viewed', { source: 'insights' });
                router.push('/paywall');
              }}
            />
          </Card>
        )}
      </Section>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="heading">{value}</Text>
    </View>
  );
}
