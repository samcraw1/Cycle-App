import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Switch, View } from 'react-native';

import { CATEGORY_LABEL, CATEGORY_ORDER } from '@/content/categories';
import { getRepos } from '@/services/bootstrap';
import { useCycleStore, useEntitlementsStore } from '@/store';
import { Button, Card, Row, Screen, Section, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';

export default function ManageSymptomsScreen() {
  const { colors, spacing } = useTheme();
  const premium = useEntitlementsStore((s) => s.premium);
  const symptoms = useCycleStore((s) => s.symptoms);
  const setActive = useCycleStore((s) => s.setSymptomActive);
  const remove = useCycleStore((s) => s.deleteCustomSymptom);

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((c) => ({
        category: c,
        items: symptoms.filter((s) => s.category === c),
      })).filter((g) => g.items.length),
    [symptoms],
  );

  if (!premium) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Card style={{ marginTop: spacing.md }}>
          <Text variant="heading">Organise your symptom list with Premium</Text>
          <Text muted style={{ marginVertical: spacing.sm }}>
            Hide symptoms you never use, delete custom ones, and file custom symptoms under any
            category.
          </Text>
          <Button title="See Premium" onPress={() => router.replace('/paywall')} />
        </Card>
      </Screen>
    );
  }

  const confirmDelete = (id: string, label: string) =>
    Alert.alert(`Delete “${label}”?`, 'Days where you logged it will lose that entry.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove(getRepos(), id) },
    ]);

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <Text muted style={{ marginVertical: spacing.md }}>
        Switch off anything you never log. Custom symptoms can be deleted.
      </Text>
      {grouped.map((g) => (
        <Section key={g.category} title={CATEGORY_LABEL[g.category]}>
          <Card>
            {g.items.map((s) => (
              <Row
                key={s.id}
                title={s.label}
                {...(s.isCustom ? { caption: 'Custom' } : {})}
                right={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    {s.isCustom ? (
                      <Button
                        title="Delete"
                        variant="ghost"
                        onPress={() => confirmDelete(s.id, s.label)}
                        accessibilityLabel={`Delete ${s.label}`}
                      />
                    ) : null}
                    <Switch
                      value={s.isActive}
                      onValueChange={(v) => void setActive(getRepos(), s.id, v)}
                      accessibilityLabel={`Show ${s.label} when logging`}
                      trackColor={{ true: colors.accent }}
                    />
                  </View>
                }
              />
            ))}
          </Card>
        </Section>
      ))}
    </Screen>
  );
}
