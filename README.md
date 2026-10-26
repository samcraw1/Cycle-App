# Cycle

A privacy-first period tracker for people with PCOS and irregular cycles.
All health data stays on the device in an encrypted SQLite database. No accounts, no cloud, no ads.

## Stack

Expo SDK 58 · React Native · TypeScript (strict) · Expo Router · expo-sqlite (SQLCipher) · Zustand · date-fns · Jest

## Setup

```bash
npm install
npm run ios        # builds a dev client; required for SQLCipher + Face ID (Expo Go is not supported)
```

```bash
npm run check      # typecheck + lint + tests
npm test
```

## Layout

```
src/app/        Expo Router screens (thin)
src/db/         encrypted DB, migrations, repositories
src/domain/     pure logic: dates, cycles, prediction, insights (unit-tested)
src/services/   analytics (typed no-op), entitlements, lock, notifications, export
src/store/      zustand stores
src/ui/         theme tokens + components
src/content/    symptom catalog, copy
```

## Privacy architecture

- Database key: 256-bit random, generated on first launch, stored in Keychain/Keystore as this-device-only.
- `PRAGMA cipher_version` is checked at boot; production builds refuse to run unencrypted.
- Analytics events are a closed TypeScript union whose props can only be literal values. A health field cannot compile.
- See `PRIVACY.md` (Phase 5) for the plain-English summary.

## Status

- [x] Phase 1: foundation (encrypted DB, migrations, app lock, navigation shell, theme)
- [ ] Phase 2: onboarding, logging, calendar, prediction engine, home
- [ ] Phase 3: insights, reminders, export/delete
- [ ] Phase 4: RevenueCat paywall, premium report
- [ ] Phase 5: polish, accessibility, PRIVACY.md
