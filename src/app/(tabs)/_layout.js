import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';

import { useAppTheme } from '../../lib/useAppTheme';

function TabIcon({ name, focusedName, color, size, focused }) {
  return <Ionicons name={focused ? focusedName : name} size={size} color={color} />;
}

export default function TabsLayout() {
  const { colors } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: (p) => <TabIcon {...p} name="home-outline" focusedName="home" />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: (p) => <TabIcon {...p} name="list-outline" focusedName="list" />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Statistics',
          tabBarIcon: (p) => <TabIcon {...p} name="pie-chart-outline" focusedName="pie-chart" />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: (p) => <TabIcon {...p} name="wallet-outline" focusedName="wallet" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: (p) => <TabIcon {...p} name="settings-outline" focusedName="settings" />,
        }}
      />
    </Tabs>
  );
}
