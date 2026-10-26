import { createMockEntitlements } from '../mock';

describe('mock entitlements', () => {
  it('starts inactive, purchases, notifies, restores', async () => {
    const svc = createMockEntitlements();
    const seen: boolean[] = [];
    const off = svc.onChange((a) => seen.push(a.has('premium')));
    expect(await svc.isActive('premium')).toBe(false);
    expect(await svc.restore()).toBe(false);
    expect((await svc.getPlans()).map((p) => p.id)).toEqual(['monthly', 'annual']);
    expect(await svc.purchase('annual')).toBe('purchased');
    expect(await svc.isActive('premium')).toBe(true);
    expect(await svc.restore()).toBe(true);
    expect(seen).toEqual([true]);
    off();
    svc.revoke('premium');
    expect(seen).toEqual([true]);
  });
});
