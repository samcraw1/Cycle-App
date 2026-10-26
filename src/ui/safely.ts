import { Alert } from 'react-native';

/**
 * Runs a fire-and-forget store action and surfaces failures to the user
 * instead of swallowing them. Local writes almost never fail, but when they
 * do (disk full, DB locked) the user must know their tap did not stick.
 */
export function safely(promise: Promise<unknown>, what = 'Could not save'): void {
  promise.catch((e: unknown) => {
    const message = e instanceof Error ? e.message : 'Please try again.';
    if (__DEV__) console.error(`[safely] ${what}:`, e);
    Alert.alert(what, message);
  });
}
