import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import type { Plan, PlanId } from '@/services/entitlements';
import { track } from '@/services/analytics';
import { useEntitlementsStore } from '@/store';
import { Button, Card, Screen, Text } from '@/ui/components';
import { TAP_TARGET, useTheme } from '@/ui/theme';

const BENEFITS = [
  'Symptoms broken down by cycle phase',
  'Doctor-ready PDF report of cycles and symptoms',
  'Organise custom symptoms into any category',
  'Supports a tracker with no ads and no data sales',
];

const PLAN_TITLE: Record<PlanId, string> = { monthly: 'Monthly', annual: 'Yearly' };

export default function PaywallScreen() {
  const { colors, radius, spacing } = useTheme();
  const service = useEntitlementsStore((s) => s.service);
  const premium = useEntitlementsStore((s) => s.premium);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<PlanId>('annual');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    service
      .getPlans()
      .then((p) => {
        setPlans(p);
        if (!p.some((x) => x.id === 'annual') && p[0]) setSelected(p[0].id);
      })
      .catch(() => setLoadError(true));
  }, [service]);

  useEffect(() => {
    if (premium && busy === null) router.back();
  }, [premium, busy]);

  async function buy() {
    setBusy('buy');
    track('purchase_started', { product: selected });
    try {
      const outcome = await service.purchase(selected);
      if (outcome === 'purchased') {
        track('purchase_completed', { product: selected });
        Alert.alert(
          'Welcome to Premium',
          'Thank you for supporting a tracker that never sells your data.',
        );
        router.back();
      } else if (outcome === 'failed') {
        Alert.alert('Purchase did not complete', 'Nothing was charged. Please try again.');
      }
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    setBusy('restore');
    try {
      const ok = await service.restore();
      if (ok) {
        track('purchase_restored');
      } else {
        Alert.alert('Nothing to restore', 'No active subscription was found for this Apple ID.');
      }
    } catch {
      Alert.alert('Could not restore', 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  const plan = plans?.find((p) => p.id === selected);

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: spacing.md }}>
        Cycle Premium
      </Text>
      <Text muted style={{ marginBottom: spacing.lg }}>
        Everything in the free app stays free. Premium adds depth.
      </Text>

      <Card style={{ marginBottom: spacing.lg }}>
        {BENEFITS.map((b) => (
          <Text key={b} style={{ marginBottom: spacing.xs }}>
            • {b}
          </Text>
        ))}
      </Card>

      {loadError ? (
        <Text muted>Plans are unavailable right now. Check your connection and try again.</Text>
      ) : plans === null ? (
        <Text muted>Loading plans…</Text>
      ) : (
        <View accessibilityRole="radiogroup" style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {plans.map((p) => {
            const on = p.id === selected;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelected(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on, checked: on }}
                accessibilityLabel={`${PLAN_TITLE[p.id]}, ${p.priceString}${p.id === 'annual' ? ' per year' : ' per month'}`}
                style={{
                  minHeight: TAP_TARGET,
                  borderWidth: 2,
                  borderColor: on ? colors.accent : colors.border,
                  backgroundColor: on ? colors.accentSoft : colors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="heading">{PLAN_TITLE[p.id]}</Text>
                  {p.id === 'annual' && p.perMonthString ? (
                    <Text variant="caption" muted>
                      {p.perMonthString} per month, billed yearly
                    </Text>
                  ) : null}
                  {p.trialDays ? (
                    <Text variant="caption" color={colors.accent}>
                      {p.trialDays}-day free trial
                    </Text>
                  ) : null}
                </View>
                <Text variant="heading">
                  {p.priceString}
                  <Text variant="caption" muted>
                    {p.id === 'annual' ? '/yr' : '/mo'}
                  </Text>
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Button
        title={plan?.trialDays ? `Start ${plan.trialDays}-day free trial` : 'Subscribe'}
        onPress={() => void buy()}
        loading={busy === 'buy'}
        disabled={!plan || busy !== null}
        fullWidth
      />
      <Button
        title="Restore purchases"
        variant="ghost"
        onPress={() => void restore()}
        loading={busy === 'restore'}
        disabled={busy !== null}
        fullWidth
      />

      <Text variant="caption" muted style={{ marginTop: spacing.md }}>
        Payment is charged to your Apple ID at confirmation. Subscriptions renew automatically
        unless cancelled at least 24 hours before the end of the current period. Manage or cancel in
        your App Store account settings. Purchases are handled by Apple; your health data is never
        sent to anyone.
      </Text>
    </Screen>
  );
}
