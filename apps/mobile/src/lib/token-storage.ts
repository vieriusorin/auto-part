import * as SecureStore from 'expo-secure-store'

/**
 * Token storage backed by expo-secure-store.
 *
 * Why not AsyncStorage or MMKV: those are unencrypted on disk. SecureStore maps
 * to Keychain on iOS and EncryptedSharedPreferences / Keystore on Android, so a
 * stolen device backup does not leak the refresh token.
 *
 * Only store the user JWT here. NEVER store a raw API secret — anything bundled
 * into the mobile app is reversible. All privileged actions must go through the
 * API, which validates the JWT on every request.
 */

const ACCESS_TOKEN_KEY = 'autocare.access_token'
const REFRESH_TOKEN_KEY = 'autocare.refresh_token'

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY, secureStoreOptions)
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions)
  },

  async setTokens(tokens: TokenPair): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken, secureStoreOptions),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken, secureStoreOptions),
    ])
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, secureStoreOptions),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions),
    ])
  },
}
