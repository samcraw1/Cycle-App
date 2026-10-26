import { useLocalSearchParams } from 'expo-router';

import { Screen, Text } from '@/ui/components';

export default function LogScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  return (
    <Screen>
      <Text variant="title">Log {date}</Text>
      <Text muted>Daily logging lands in Phase 2.</Text>
    </Screen>
  );
}
