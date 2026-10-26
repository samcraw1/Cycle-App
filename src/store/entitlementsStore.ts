import { create } from 'zustand';

import { createMockEntitlements, type EntitlementsService } from '@/services/entitlements';

interface EntitlementsState {
  premium: boolean;
  service: EntitlementsService;
  /** Swap the backing service (RevenueCat in Phase 4). Subscribes to changes. */
  attach(service: EntitlementsService): Promise<void>;
}

let unsubscribe: (() => void) | null = null;

export const useEntitlementsStore = create<EntitlementsState>((set) => ({
  premium: false,
  service: createMockEntitlements(),
  async attach(service) {
    unsubscribe?.();
    unsubscribe = service.onChange((active) => set({ premium: active.has('premium') }));
    set({ service, premium: await service.isActive('premium') });
  },
}));
