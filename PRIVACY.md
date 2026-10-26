# Privacy

Cycle is a period tracker that never sees your data. This page says exactly what the app stores, where, and what leaves your phone. It is written to be checked against the code, not to reassure.

## What is stored

| Data | Where | Why |
|---|---|---|
| Period days and flow (spotting, light, medium, heavy) | `period_days` table | Cycle history and predictions |
| Daily log: mood, notes, symptoms | `day_logs`, `day_symptoms` tables | Insights and the report |
| Symptom list, including custom symptoms you add | `symptoms` table | Logging UI |
| Onboarding answers (typical cycle and period length, "irregular", goals) | `settings` table | Early predictions |
| Preferences (app lock, reminders, discreet wording, premium flags) | `settings` table | App behaviour |

That is the complete list. There is no account, no email, no name.

## Where it lives

- One SQLite database file, `cycle.db`, inside the app's private container on your phone.
- The file is encrypted with SQLCipher (AES-256). The key is 32 random bytes generated on first launch and stored in the iOS Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`. It is never written to disk in plain form, never backed up, and never copied to another device.
- On launch the app checks that SQLCipher is active. A release build refuses to run unencrypted.

## What leaves the phone

**Nothing about your health.** Specifically:

- No server. The app has no backend. There is no sync, no account, and no upload.
- No ad networks, no Meta/TikTok/Google pixels, no third-party analytics SDKs.
- The analytics wrapper in the code (`src/services/analytics/`) is a no-op. Its event list is a closed TypeScript type whose fields can only be fixed literal values, so a date, symptom, note, or mood cannot be passed to it even by mistake. If analytics is ever switched on, only events like `app_open` and `paywall_viewed` can exist.
- Reminders are local notifications scheduled on the phone. Nothing is pushed from a server. By default the text is "You have a reminder" with no health words; you can switch to plainer wording in Settings.
- Premium subscriptions are processed by Apple and RevenueCat. They receive an anonymous app user id and purchase state, which Apple already has. They never receive health data.

## Export and delete

- **Export** writes a JSON or CSV file to the app's cache and opens the iOS share sheet. You choose where it goes. The app does not send it anywhere.
- **Doctor report (Premium)** renders a PDF on the phone and opens the same share sheet.
- **Delete everything** cancels reminders, deletes the database file, and deletes the Keychain key. After that the data is unrecoverable, including by us.

## Backups and new phones

iCloud or Finder backups include the encrypted database but not the key, so a restore to a new phone cannot open it. Export before switching phones. This is a deliberate trade-off: no key ever leaves the device.

## Predictions and medical use

Predictions are estimates from what you log. They are shown as a date range with a confidence label and are not medical advice, a diagnosis, or a form of contraception. Cycle-phase labels are population averages and must not be used for birth control. The app shows a neutral "consider talking to a doctor" note only for sustained patterns (no period for 90+ days, or cycles consistently under 21 or over 45 days).

## Verifying this

- Database and key: `src/db/database.ts`, `src/db/key.ts`
- Analytics guard: `src/services/analytics/events.ts`
- Reminders: `src/services/notifications/`
- Export and delete: `src/services/export/`
- Dependencies that touch the network: `react-native-purchases` (purchases only). Search the lockfile for `firebase`, `facebook`, `segment`, `amplitude`, `sentry`: none.
