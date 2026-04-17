---
name: security-review
description: >
  Mobile security review for Autocare React Native app.
  Use when adding auth, handling tokens, storing sensitive data, implementing biometrics,
  handling deep links, or building payment/sensitive features.
  Stack: React Native + Expo, JWT, Expo Secure Store, expo-local-authentication.
---

# Mobile Security Review

For detailed implementation patterns: read `references/full-guide.md`

---

## When to Apply This Skill

- Implementing authentication or biometric flows
- Storing or reading tokens, credentials, or sensitive user data
- Handling deep links or external URL navigation
- Building payment, wallet, or PII-handling screens
- Writing code that touches `AuthService`, `SecureStore`, or `AsyncStorage`

---

## Token & Credential Storage

**Rule: JWT and credentials go in Expo Secure Store only.**

| Data                        | Storage                                           |
| --------------------------- | ------------------------------------------------- |
| Access token, refresh token | `expo-secure-store` (encrypted)                   |
| Biometric credentials       | `expo-secure-store`                               |
| User preferences, UI state  | `AsyncStorage` (unencrypted — non-sensitive only) |
| Device ID, analytics IDs    | `AsyncStorage`                                    |
| Passwords, PINs             | Never store                                       |

```tsx
// ✅ Store sensitive data
await SecureStore.setItemAsync('access_token', token);

// ❌ Never do this for tokens
await AsyncStorage.setItem('access_token', token);
```

**Logout must clear both stores:**

```tsx
await SecureStore.deleteItemAsync('access_token');
await SecureStore.deleteItemAsync('refresh_token');
await AsyncStorage.clear(); // clear non-sensitive state too
```

---

## Biometric Authentication

- `expo-local-authentication` handles Face ID / Touch ID / Fingerprint
- Always check `hasHardwareAsync()` and `isEnrolledAsync()` before prompting
- Store the credential in `SecureStore` — biometric auth gates the retrieval, doesn't encrypt independently
- Provide a passcode fallback — biometric can fail (wet fingers, hardware issues)

---

## API Security

- [ ] All API calls use `fetchClient()` — never raw `fetch()` for authenticated endpoints
- [ ] Auth middleware automatically injects `Bearer` token + `X-ApiKey`
- [ ] Never handle 401 manually in components — middleware retries with refreshed token
- [ ] Never log tokens, credentials, or sensitive response data
- [ ] All API communication is HTTPS — `fetchClient` uses the base URL from `env.ts`

---

## Deep Links

- [ ] Validate the URL scheme and path before acting on a deep link
- [ ] Never pass tokens or secrets in deep link URLs
- [ ] Strip and re-validate all user input from deep link params
- [ ] Treat deep link data as untrusted input

---

## Sensitive Screens

For screens showing payment info, PII, wallet balance:

- [ ] Disable screenshots on Android (requires native config or Expo plugin)
- [ ] Mask values when app is in background (`AppState` listener)
- [ ] Don't log screen content or render PII in console

---

## Input Handling

- [ ] `keyboardType` and `textContentType` set correctly on sensitive inputs
- [ ] `secureTextEntry` on password fields
- [ ] Disable autocorrect/autocomplete on sensitive fields: `autoCorrect={false}`, `autoComplete="off"`
- [ ] Validate inputs before sending to API (not just schema validation — length, format, range)

---

## Environment Variables & Secrets

- [ ] No API keys, tokens, or secrets hardcoded in source
- [ ] Client-side env vars use `EXPO_PUBLIC_` prefix (visible in app bundle — non-secret only)
- [ ] Server-side secrets in EAS Build secrets (`eas.json`) — never in `.env` committed to git
- [ ] `.env` files in `.gitignore`

---

## Checklist Summary

```
Tokens:
- [ ] JWT in Expo Secure Store — not AsyncStorage
- [ ] Logout clears SecureStore + AsyncStorage
- [ ] No tokens logged or stored in plaintext

API:
- [ ] fetchClient() for all authenticated calls
- [ ] HTTPS enforced via env.ts base URL
- [ ] No 401 handling in components

Deep Links:
- [ ] Scheme + path validated before handling
- [ ] No secrets in link URLs

Inputs:
- [ ] secureTextEntry on passwords
- [ ] Autocomplete disabled on sensitive fields

Environment:
- [ ] No hardcoded secrets
- [ ] EXPO_PUBLIC_ only for non-sensitive client vars
```
