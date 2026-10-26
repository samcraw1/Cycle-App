import type { AnalyticsEventName, EventArgs, AnalyticsEvents } from './events';

export type { AnalyticsEventName, AnalyticsEvents } from './events';

export interface AnalyticsSink {
  send<E extends AnalyticsEventName>(event: E, props: AnalyticsEvents[E]): void;
}

/** MVP: analytics is a no-op. Wire a sink later without touching callers. */
const noopSink: AnalyticsSink = {
  send() {
    /* intentionally empty */
  },
};

let sink: AnalyticsSink = noopSink;

export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next ?? noopSink;
}

/**
 * Emit a non-health analytics event. Only events declared in `events.ts`
 * compile, with only their declared literal-valued props.
 */
export function track<E extends AnalyticsEventName>(event: E, ...args: EventArgs<E>): void {
  const props = (args[0] ?? {}) as AnalyticsEvents[E];
  sink.send(event, props);
}
