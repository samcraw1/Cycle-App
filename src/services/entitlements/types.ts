/** Isolates RevenueCat so the rest of the app never imports it directly. */
export type Entitlement = 'premium';
export type PlanId = 'monthly' | 'annual';

export interface Plan {
  id: PlanId;
  /** Localized price, e.g. "$4.99". */
  priceString: string;
  /** Localized per-month equivalent for annual plans, when known. */
  perMonthString: string | null;
  trialDays: number | null;
}

export type PurchaseOutcome = 'purchased' | 'cancelled' | 'failed';

export interface EntitlementsService {
  readonly kind: 'mock' | 'revenuecat';
  isActive(entitlement: Entitlement): Promise<boolean>;
  /** Subscribe to changes; returns an unsubscribe function. */
  onChange(listener: (active: ReadonlySet<Entitlement>) => void): () => void;
  getPlans(): Promise<Plan[]>;
  purchase(plan: PlanId): Promise<PurchaseOutcome>;
  /** Resolves true when premium is active after restoring. */
  restore(): Promise<boolean>;
}
