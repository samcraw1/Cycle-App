import { setAnalyticsSink, track, type AnalyticsSink } from '../index';
import type { AnalyticsEvents } from '../events';

describe('analytics wrapper', () => {
  afterEach(() => setAnalyticsSink(null));

  it('forwards declared events to the sink', () => {
    const send = jest.fn();
    const sink: AnalyticsSink = { send };
    setAnalyticsSink(sink);
    track('app_open');
    track('paywall_viewed', { source: 'settings' });
    expect(send).toHaveBeenCalledWith('app_open', {});
    expect(send).toHaveBeenCalledWith('paywall_viewed', { source: 'settings' });
  });

  it('is a silent no-op without a sink', () => {
    expect(() => track('onboarding_completed')).not.toThrow();
  });

  it('rejects health data at compile time', () => {
    // @ts-expect-error unknown event
    track('period_logged');
    // @ts-expect-error undeclared prop
    track('paywall_viewed', { source: 'settings', date: '2026-03-01' });
    // @ts-expect-error prop outside the literal union
    track('paywall_viewed', { source: 'cramps' });
    // @ts-expect-error props required for this event
    track('purchase_started');

    type Keys = keyof AnalyticsEvents;
    const never: Exclude<Keys, Keys> = undefined as never;
    expect(never).toBeUndefined();
  });
});
