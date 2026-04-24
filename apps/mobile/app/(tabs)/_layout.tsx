import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { useAppTheme } from '../../src/theme/theme-context'

type TabIconProps = {
  color: string
  focused: boolean
  size: number
}

const TabsLayout = () => {
  const { theme } = useAppTheme()

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.screenBackground },
        headerTintColor: theme.colors.textPrimary,
        sceneStyle: { backgroundColor: theme.colors.screenBackground },
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.screenBackground,
          borderTopColor: theme.colors.borderSubtle,
        },
      }}
    >
      <Tabs.Screen
        name='garage'
        options={{
          title: 'Garage',
          headerTitle: 'Garage',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name='car-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='costs'
        options={{
          title: 'Costs',
          headerTitle: 'Costs',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name='card-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='insights'
        options={{
          title: 'Insights',
          headerTitle: 'Insights',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name='analytics-outline' size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabsLayout
