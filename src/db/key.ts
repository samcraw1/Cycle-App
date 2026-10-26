import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'cycle.db.key.v1';
const KEY_BYTES = 32;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns the 256-bit database key as hex, generating it on first run.
 * Stored in the device Keychain/Keystore, this-device-only, so it is never
 * backed up or migrated. Without it the database file is unreadable.
 */
export async function getOrCreateDbKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) return existing;

  const key = toHex(Crypto.getRandomBytes(KEY_BYTES));
  await SecureStore.setItemAsync(KEY_NAME, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}

export async function deleteDbKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_NAME);
}
