import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  outline: IconName;
  filled: IconName;
  color: ColorValue;
  focused: boolean;
  size: number;
}

function TabIcon({ outline, filled, color, focused, size }: TabIconProps) {
  return (
    <Ionicons
      name={focused ? filled : outline}
      size={size}
      color={typeof color === 'string' ? color : undefined}
    />
  );
}

const TABS: { name: string; title: string; outline: IconName; filled: IconName }[] = [
  { name: 'index', title: 'Today', outline: 'home-outline', filled: 'home' },
  { name: 'calendar', title: 'Calendar', outline: 'calendar-outline', filled: 'calendar' },
  { name: 'insights', title: 'Insights', outline: 'bar-chart-outline', filled: 'bar-chart' },
  { name: 'settings', title: 'Settings', outline: 'settings-outline', filled: 'settings' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: (props) => <TabIcon {...props} outline={tab.outline} filled={tab.filled} />,
          }}
        />
      ))}
    </Tabs>
  );
}
