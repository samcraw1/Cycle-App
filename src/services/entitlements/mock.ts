import type { Entitlement, EntitlementsService, Plan, PlanId } from './types';

const MOCK_PLANS: Plan[] = [
  { id: 'monthly', priceString: '$4.99', perMonthString: null, trialDays: 7 },
  { id: 'annual', priceString: '$29.99', perMonthString: '$2.50', trialDays: 7 },
];

/** Dev/test implementation. Purchases succeed after a short delay. */
export function createMockEntitlements(
  initial: readonly Entitlement[] = [],
): EntitlementsService & {
  grant(e: Entitlement): void;
  revoke(e: Entitlement): void;
} {
  const active = new Set<Entitlement>(initial);
  const listeners = new Set<(a: ReadonlySet<Entitlement>) => void>();
  const notify = () => listeners.forEach((l) => l(new Set(active)));
  return {
    kind: 'mock',
    async isActive(e) {
      return active.has(e);
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async getPlans() {
      return MOCK_PLANS;
    },
    async purchase(_plan: PlanId) {
      await new Promise((r) => setTimeout(r, 400));
      active.add('premium');
      notify();
      return 'purchased';
    },
    async restore() {
      return active.has('premium');
    },
    grant(e) {
      active.add(e);
      notify();
    },
    revoke(e) {
      active.delete(e);
      notify();
    },
  };
}
