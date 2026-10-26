import type { Entitlement, EntitlementsService } from './types';

/** Dev/test implementation with a toggleable premium flag. */
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
    async isActive(e) {
      return active.has(e);
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
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
