import { Redirect } from 'expo-router';

import { useSettingsStore } from '@/store';

export default function Index() {
  const done = useSettingsStore((s) => s.values.onboarding_complete);
  return <Redirect href={done ? '/(tabs)' : '/(onboarding)'} />;
}
