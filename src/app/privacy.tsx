import { Screen, Section, Text } from '@/ui/components';
import { useTheme } from '@/ui/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'What is stored',
    body: 'Period days and flow, symptoms, mood, notes, your onboarding answers, and your settings. That is the complete list.',
  },
  {
    title: 'Where it lives',
    body: 'In one encrypted database file inside this app on this phone. The encryption key is a random 256-bit key kept in the iOS Keychain, marked “this device only”, so it is never backed up or copied to another device.',
  },
  {
    title: 'What leaves the phone',
    body: 'Nothing about your health. There is no account, no server, and no sync. The app does not include ad networks or tracking pixels. If we ever add usage analytics, the code is built so a health field cannot be sent even by mistake.',
  },
  {
    title: 'Notifications',
    body: 'Reminders are scheduled on the phone itself, not pushed from a server. By default they say “You have a reminder” with no health words.',
  },
  {
    title: 'Export and delete',
    body: 'Export creates a file and opens the iOS share sheet; you decide where it goes. Delete everything removes the database and its key. After that the data cannot be recovered, including by us.',
  },
  {
    title: 'Backups and new phones',
    body: 'Because the key is device-only, an iCloud restore to a new phone will not unlock the old database. Use Export before switching phones.',
  },
];

export default function PrivacyScreen() {
  const { spacing } = useTheme();
  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <Text
        variant="title"
        accessibilityRole="header"
        style={{ marginTop: spacing.md, marginBottom: spacing.lg }}
      >
        Your data, in plain English
      </Text>
      {SECTIONS.map((s) => (
        <Section key={s.title} title={s.title}>
          <Text>{s.body}</Text>
        </Section>
      ))}
    </Screen>
  );
}
