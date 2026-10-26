# Cycle

A privacy-first period tracker for people with PCOS and irregular cycles. Predictions stay honest when cycles are irregular, symptom tracking fits the niche, and all health data stays on the device in an encrypted database. No accounts, no cloud, no ads.

See [PRIVACY.md](PRIVACY.md) for exactly what is stored and where.

## Features

- **Onboarding** in five screens: privacy promise, last period, typical cycle length (or "irregular"), goals, lock and reminders.
- **Daily log** that autosaves every tap: flow, mood, symptoms (core set plus a PCOS set, plus your own), notes.
- **Calendar** with logged periods, the predicted range, and symptom dots.
- **Home** with "Day X of cycle" and the next period as a range with a confidence label. Never a single date.
- **Insights**: cycle length history, average and variability, period length, most logged symptoms. Premium adds symptoms by estimated cycle phase.
- **Reminders**: period expected and daily log, scheduled locally with discreet lock-screen wording.
- **Export** to JSON or CSV and **delete everything**, both one tap.
- **Premium** via RevenueCat: phase insights, doctor-ready PDF report, symptom management.
- **App lock** with Face ID, Touch ID, or passcode.
- Dark mode, Dynamic Type, accessibility labels on every control, 48pt tap targets.

## Stack

Expo SDK 58 · React Native 0.88 · TypeScript strict · Expo Router · expo-sqlite with SQLCipher · Zustand · date-fns · react-native-purchases · Jest + node:sqlite

## Setup

```bash
npm install
npm run ios          # builds a dev client on the simulator (Expo Go is not supported: SQLCipher, Face ID, purchases)
```

```bash
npm run check        # typecheck + lint + tests
npm test
npx expo-doctor
```

To verify features that render HTML (the PDF report) use an iOS 26 simulator; the iOS 17.5 simulator runtime cannot launch WebKit.

### Subscriptions (RevenueCat)

Without keys the app uses a mock entitlements service (purchases succeed instantly; a dev toggle in Settings flips premium). To use RevenueCat:

1. In the RevenueCat dashboard create an entitlement with identifier `premium`.
2. Create an offering (set as current) with a **monthly** and an **annual** package pointing at your App Store Connect products.
3. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_RC_IOS_KEY` (public SDK key). Rebuild the dev client.

RevenueCat receives only an anonymous app user id and purchase state. No health data is ever sent.

## Layout

```
src/app/          Expo Router screens (thin)
src/db/           encrypted DB, migrations, repositories
src/domain/       pure logic, unit-tested: dates, cycles, prediction, insights
src/services/     analytics (typed no-op), entitlements, lock, notifications, export, report
src/store/        zustand stores and selectors
src/ui/           theme tokens, components, formatters
src/content/      symptom catalog, categories, copy
```

## How predictions work

`src/domain/prediction/predict.ts`, fully unit-tested.

- Input: period start dates derived from logged period days (runs of days with at most a one-day gap; spotting-only runs are ignored).
- Uses the last six cycle lengths, drops anything outside 15–90 days, then anything beyond 2 standard deviations (when there are at least four), and takes a recency-weighted mean.
- Output is always a range: ±max(2, 1.5 × SD) days, capped at ±14. Confidence is low with fewer than three cycles or SD over 5, high with five or more cycles and SD ≤ 2.5, medium otherwise.
- With fewer than two cycles it uses the onboarding estimate (±4, or ±7 if marked irregular) at low confidence.
- When the range has passed without a period, the range is anchored at today and the UI says so plainly.

## Data model

- `period_days(date, flow)` — periods and cycles are derived, not stored.
- `day_logs(date, mood, notes, updated_at)` and `day_symptoms(date, symptom_id)`.
- `symptoms(id, label, category, is_custom, is_active, sort_order)`.
- `settings(key, value)` with JSON values and typed keys.
- Migrations run on `PRAGMA user_version`; append-only in `src/db/migrations/`.

## Privacy architecture

- Database key: 256-bit random, generated on first launch, stored in Keychain as this-device-only.
- `PRAGMA cipher_version` is checked at boot; production builds refuse to run unencrypted.
- Analytics events are a closed TypeScript union whose props can only be literal values. A health field cannot compile.
- Reminders are local notifications with no health words by default.

## Release checklist

- [ ] Replace placeholder app icon and splash in `assets/`.
- [ ] Set RevenueCat keys and products; test a sandbox purchase on a device.
- [ ] Test Face ID on a physical device (simulator cannot enroll biometrics).
- [ ] Review `PRIVACY.md` against the App Store privacy nutrition label: "Data Not Collected".
- [ ] Bump `version` in `app.json`.

## Status

- [x] Phase 1: foundation (encrypted DB, migrations, app lock, navigation shell, theme)
- [x] Phase 2: onboarding, logging, calendar, prediction engine, home
- [x] Phase 3: insights, reminders, export/delete
- [x] Phase 4: RevenueCat paywall, premium report
- [x] Phase 5: polish, accessibility, error handling, PRIVACY.md
