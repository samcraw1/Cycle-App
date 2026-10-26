import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import type { Entitlement, EntitlementsService, Plan, PlanId } from './types';

/** Must match the entitlement identifier configured in the RevenueCat dashboard. */
export const PREMIUM_ENTITLEMENT_ID = 'premium';

/** Public SDK keys only. Set in .env as EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY. */
export function getRevenueCatApiKey(): string | null {
  const key =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_RC_IOS_KEY
      : process.env.EXPO_PUBLIC_RC_ANDROID_KEY;
  return key && key.length > 0 ? key : null;
}

function activeSet(info: CustomerInfo): Set<Entitlement> {
  const out = new Set<Entitlement>();
  if (info.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined) out.add('premium');
  return out;
}

function planIdFor(pkg: PurchasesPackage): PlanId | null {
  if (pkg.packageType === PACKAGE_TYPE.MONTHLY) return 'monthly';
  if (pkg.packageType === PACKAGE_TYPE.ANNUAL) return 'annual';
  return null;
}

function toPlan(pkg: PurchasesPackage, id: PlanId): Plan {
  const product = pkg.product;
  const trial = product.introPrice;
  const perMonth =
    id === 'annual' && product.price > 0 && product.currencyCode
      ? formatMoney(product.price / 12, product.currencyCode, product.priceString)
      : null;
  return {
    id,
    priceString: product.priceString,
    perMonthString: perMonth,
    trialDays:
      trial && trial.price === 0 ? periodToDays(trial.periodUnit, trial.periodNumberOfUnits) : null,
  };
}

function periodToDays(unit: string, n: number): number {
  const u = unit.toUpperCase();
  if (u === 'DAY') return n;
  if (u === 'WEEK') return n * 7;
  if (u === 'MONTH') return n * 30;
  if (u === 'YEAR') return n * 365;
  return n;
}

function formatMoney(amount: number, currency: string, sample: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    // Fall back to the symbol from the store's own string.
    const symbol = sample.replace(/[\d.,\s]/g, '') || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * RevenueCat-backed entitlements. Configure once at boot. No health data is
 * ever passed to RevenueCat; it sees only an anonymous app user id and
 * purchase state, which Apple/Google already have.
 */
export function createRevenueCatEntitlements(apiKey: string): EntitlementsService {
  const listeners = new Set<(a: ReadonlySet<Entitlement>) => void>();
  let active = new Set<Entitlement>();
  let packages = new Map<PlanId, PurchasesPackage>();

  const update = (info: CustomerInfo) => {
    active = activeSet(info);
    listeners.forEach((l) => l(new Set(active)));
  };

  void Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
  Purchases.addCustomerInfoUpdateListener(update);
  void Purchases.getCustomerInfo()
    .then(update)
    .catch(() => undefined);

  async function loadPackages(): Promise<Map<PlanId, PurchasesPackage>> {
    if (packages.size > 0) return packages;
    const offerings = await Purchases.getOfferings();
    const next = new Map<PlanId, PurchasesPackage>();
    for (const pkg of offerings.current?.availablePackages ?? []) {
      const id = planIdFor(pkg);
      if (id) next.set(id, pkg);
    }
    packages = next;
    return packages;
  }

  return {
    kind: 'revenuecat',
    async isActive(e) {
      if (active.has(e)) return true;
      try {
        update(await Purchases.getCustomerInfo());
      } catch {
        /* offline: keep cached state */
      }
      return active.has(e);
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async getPlans() {
      const map = await loadPackages();
      const order: PlanId[] = ['monthly', 'annual'];
      return order.flatMap((id) => {
        const pkg = map.get(id);
        return pkg ? [toPlan(pkg, id)] : [];
      });
    },
    async purchase(plan) {
      const pkg = (await loadPackages()).get(plan);
      if (!pkg) return 'failed';
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        update(customerInfo);
        return active.has('premium') ? 'purchased' : 'failed';
      } catch (e) {
        const cancelled =
          typeof e === 'object' && e !== null && (e as { userCancelled?: boolean }).userCancelled;
        return cancelled ? 'cancelled' : 'failed';
      }
    },
    async restore() {
      const info = await Purchases.restorePurchases();
      update(info);
      return active.has('premium');
    },
  };
}
