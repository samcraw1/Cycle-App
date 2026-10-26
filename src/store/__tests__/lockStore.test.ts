import { authenticate } from '@/services/lock/biometrics';

import { initializeLock, LOCK_GRACE_MS, useLockStore } from '../lockStore';

jest.mock('@/services/lock/biometrics', () => ({
  authenticate: jest.fn(),
}));

const mockedAuth = jest.mocked(authenticate);

beforeEach(() => {
  mockedAuth.mockReset();
  useLockStore.setState({ enabled: false, locked: false, backgroundedAt: null });
});

describe('lockStore', () => {
  it('starts locked on cold start when enabled', () => {
    initializeLock(true);
    expect(useLockStore.getState().locked).toBe(true);
    initializeLock(false);
    expect(useLockStore.getState().locked).toBe(false);
  });

  it('does nothing when disabled', () => {
    const s = useLockStore.getState();
    s.onBackground(1000);
    s.onForeground(1000 + LOCK_GRACE_MS * 10);
    expect(useLockStore.getState().locked).toBe(false);
  });

  it('re-locks only after the grace period', () => {
    useLockStore.setState({ enabled: true });
    const s = useLockStore.getState();
    s.onBackground(1000);
    s.onForeground(1000 + LOCK_GRACE_MS - 1);
    expect(useLockStore.getState().locked).toBe(false);

    s.onBackground(5000);
    s.onForeground(5000 + LOCK_GRACE_MS);
    expect(useLockStore.getState().locked).toBe(true);
    expect(useLockStore.getState().backgroundedAt).toBeNull();
  });

  it('unlocks on successful auth, stays locked otherwise', async () => {
    useLockStore.setState({ enabled: true, locked: true });
    mockedAuth.mockResolvedValueOnce('failed');
    expect(await useLockStore.getState().unlock()).toBe('failed');
    expect(useLockStore.getState().locked).toBe(true);

    mockedAuth.mockResolvedValueOnce('success');
    expect(await useLockStore.getState().unlock()).toBe('success');
    expect(useLockStore.getState().locked).toBe(false);
  });

  it('disabling clears the locked state', () => {
    useLockStore.setState({ enabled: true, locked: true });
    useLockStore.getState().setEnabled(false);
    expect(useLockStore.getState().locked).toBe(false);
  });
});
