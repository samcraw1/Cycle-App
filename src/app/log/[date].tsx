import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { CATEGORY_LABEL, CATEGORY_ORDER } from '@/content/categories';
import type { SymptomCategory } from '@/content/symptoms';
import { FLOWS, MOODS, type Flow, type Mood } from '@/db';
import { isIsoDate, today } from '@/domain/dates';
import { getRepos } from '@/services/bootstrap';
import { useCycleStore, useEntitlementsStore } from '@/store';
import { Button, Chip, Screen, Section, Text } from '@/ui/components';
import { formatDayLong } from '@/ui/format';
import { TAP_TARGET, useTheme } from '@/ui/theme';

const MOOD_LABEL: Record<Mood, string> = {
  great: 'Great',
  good: 'Good',
  okay: 'Okay',
  low: 'Low',
  rough: 'Rough',
};
const FLOW_LABEL: Record<Flow, string> = {
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

export default function LogScreen() {
  const { colors, radius, spacing } = useTheme();
  const params = useLocalSearchParams<{ date: string }>();
  const now = today();
  const date = params.date === 'today' ? now : isIsoDate(params.date) ? params.date : null;

  const periodDay = useCycleStore((s) =>
    date ? s.periodDays.find((p) => p.date === date) : undefined,
  );
  const log = useCycleStore((s) => (date ? s.dayLogs[date] : undefined));
  const allSymptoms = useCycleStore((s) => s.symptoms);
  const symptoms = useMemo(() => allSymptoms.filter((s) => s.isActive), [allSymptoms]);
  const premium = useEntitlementsStore((s) => s.premium);
  const { setPeriodDay, removePeriodDay, saveDayLog, addCustomSymptom } = useCycleStore();

  const [notes, setNotes] = useState(log?.notes ?? '');
  const [custom, setCustom] = useState('');
  const [customCategory, setCustomCategory] = useState<SymptomCategory>('other');

  const grouped = useMemo(() => {
    const map = new Map<SymptomCategory, typeof symptoms>();
    for (const s of symptoms) map.set(s.category, [...(map.get(s.category) ?? []), s]);
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, [symptoms]);

  if (!date) {
    return (
      <Screen>
        <Text variant="title">Unknown date</Text>
      </Screen>
    );
  }
  if (date > now) {
    return (
      <Screen>
        <Stack.Screen options={{ title: formatDayLong(date) }} />
        <Text variant="title">That’s in the future</Text>
        <Text muted>You can log a day once it arrives.</Text>
      </Screen>
    );
  }

  const current = {
    date,
    mood: log?.mood ?? null,
    notes: log?.notes ?? null,
    symptomIds: log?.symptomIds ?? [],
  };
  const repos = getRepos();

  const setFlow = (flow: Flow | null) =>
    flow ? void setPeriodDay(repos, { date, flow }) : void removePeriodDay(repos, date);
  const toggleSymptom = (id: string) => {
    const ids = current.symptomIds.includes(id)
      ? current.symptomIds.filter((x) => x !== id)
      : [...current.symptomIds, id];
    void saveDayLog(repos, { ...current, symptomIds: ids });
  };
  const setMood = (mood: Mood) =>
    void saveDayLog(repos, { ...current, mood: current.mood === mood ? null : mood });
  const commitNotes = () => {
    const trimmed = notes.trim();
    if ((current.notes ?? '') !== trimmed)
      void saveDayLog(repos, { ...current, notes: trimmed || null });
  };
  const addCustom = async () => {
    const label = custom.trim();
    if (!label) return;
    const s = await addCustomSymptom(repos, label, premium ? customCategory : 'other');
    setCustom('');
    void saveDayLog(repos, { ...current, symptomIds: [...current.symptomIds, s.id] });
  };

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: date === now ? 'Today' : formatDayLong(date) }} />

      <Section title="Period">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip label="None" selected={!periodDay} onPress={() => setFlow(null)} tone="period" />
          {FLOWS.map((f) => (
            <Chip
              key={f}
              label={FLOW_LABEL[f]}
              selected={periodDay?.flow === f}
              onPress={() => setFlow(f)}
              tone="period"
            />
          ))}
        </View>
      </Section>

      <Section title="Mood">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {MOODS.map((m) => (
            <Chip
              key={m}
              label={MOOD_LABEL[m]}
              selected={current.mood === m}
              onPress={() => setMood(m)}
            />
          ))}
        </View>
      </Section>

      {grouped.map(({ category, items }) => (
        <Section key={category} title={CATEGORY_LABEL[category]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {items.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                selected={current.symptomIds.includes(s.id)}
                onPress={() => toggleSymptom(s.id)}
              />
            ))}
          </View>
        </Section>
      ))}

      <Section title="Add your own symptom">
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={() => void addCustom()}
            placeholder="e.g. Night sweats"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="New symptom name"
            returnKeyType="done"
            maxLength={40}
            style={{
              flex: 1,
              minHeight: TAP_TARGET,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              color: colors.text,
              backgroundColor: colors.surface,
              fontSize: 16,
            }}
          />
          <Button
            title="Add"
            variant="secondary"
            onPress={() => void addCustom()}
            disabled={!custom.trim()}
          />
        </View>
        {premium ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }}>
            {CATEGORY_ORDER.map((c) => (
              <Chip
                key={c}
                label={CATEGORY_LABEL[c]}
                selected={customCategory === c}
                onPress={() => setCustomCategory(c)}
              />
            ))}
          </View>
        ) : null}
      </Section>

      <Section title="Notes">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          onEndEditing={commitNotes}
          onBlur={commitNotes}
          multiline
          placeholder="Anything else worth remembering"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Notes"
          style={{
            minHeight: 96,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
            color: colors.text,
            backgroundColor: colors.surface,
            fontSize: 16,
            textAlignVertical: 'top',
          }}
        />
      </Section>

      <Text variant="caption" muted style={{ textAlign: 'center', marginBottom: spacing.lg }}>
        Saved automatically on this device.
      </Text>
    </Screen>
  );
}
