/** Isolates RevenueCat so the rest of the app never imports it directly. */
export type Entitlement = 'premium';

export interface EntitlementsService {
  isActive(entitlement: Entitlement): Promise<boolean>;
  /** Subscribe to changes; returns an unsubscribe function. */
  onChange(listener: (active: ReadonlySet<Entitlement>) => void): () => void;
}
