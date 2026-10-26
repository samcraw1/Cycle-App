import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricKind = 'face' | 'fingerprint' | 'iris' | 'none';

export interface LockCapability {
  /** Device has biometrics hardware AND the user has enrolled. */
  biometricsAvailable: boolean;
  kind: BiometricKind;
}

export async function getLockCapability(): Promise<LockCapability> {
  const [hasHardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  const T = LocalAuthentication.AuthenticationType;
  const kind: BiometricKind = types.includes(T.FACIAL_RECOGNITION)
    ? 'face'
    : types.includes(T.FINGERPRINT)
      ? 'fingerprint'
      : types.includes(T.IRIS)
        ? 'iris'
        : 'none';
  return { biometricsAvailable: hasHardware && enrolled, kind };
}

export type AuthOutcome = 'success' | 'cancelled' | 'failed' | 'unavailable';

/**
 * Prompts for Face ID / Touch ID, falling back to the device passcode.
 * Never throws; returns a coarse outcome the UI can act on.
 */
export async function authenticate(promptMessage = 'Unlock'): Promise<AuthOutcome> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    if (result.success) return 'success';
    if (
      result.error === 'user_cancel' ||
      result.error === 'system_cancel' ||
      result.error === 'app_cancel'
    ) {
      return 'cancelled';
    }
    if (result.error === 'not_enrolled' || result.error === 'not_available') return 'unavailable';
    return 'failed';
  } catch {
    return 'unavailable';
  }
}
