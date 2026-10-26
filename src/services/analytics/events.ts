/**
 * The closed set of analytics events this app may ever emit.
 *
 * Privacy rule: no health data leaves the device. This file enforces that
 * structurally. Every property must be a literal union (never `string`,
 * `number`, or an object), so there is no slot a date, symptom, mood, or
 * note could travel through. Adding a free-text field here is a type error.
 */
export type AnalyticsEvents = {
  app_open: EmptyProps;
  onboarding_completed: EmptyProps;
  paywall_viewed: { source: 'insights' | 'settings' | 'onboarding' | 'report' };
  purchase_started: { product: 'monthly' | 'annual' };
  purchase_completed: { product: 'monthly' | 'annual' };
  purchase_restored: EmptyProps;
};

export type EmptyProps = Record<string, never>;

export type AnalyticsEventName = keyof AnalyticsEvents;

/** Allowed property value types: literal unions and booleans only. */
type AllowedValue = boolean;

type IsLiteralUnion<T> = T extends string
  ? string extends T
    ? false
    : true
  : T extends number
    ? number extends T
      ? false
      : true
    : false;

type ValueAllowed<T> = T extends AllowedValue ? true : IsLiteralUnion<T>;

type PropsAllowed<P> = P extends EmptyProps
  ? true
  : { [K in keyof P]: ValueAllowed<P[K]> }[keyof P] extends true
    ? true
    : false;

/** Compile-time guard: fails the build if any event gains a free-form field. */
type AssertAllAllowed = {
  [E in AnalyticsEventName]: PropsAllowed<AnalyticsEvents[E]>;
}[AnalyticsEventName] extends true
  ? true
  : never;

export const ANALYTICS_SCHEMA_OK: AssertAllAllowed = true;

export type EventArgs<E extends AnalyticsEventName> = AnalyticsEvents[E] extends EmptyProps
  ? []
  : [props: AnalyticsEvents[E]];
