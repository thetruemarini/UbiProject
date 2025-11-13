// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35', // Arancione come nell'immagine
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 90,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 30 : 26} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 30 : 26} name="magnifyingglass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={40} name="plus.circle.fill" color="#FF6B35" />
          ),
        }}
      />
      <Tabs.Screen
        name="itineraries"
        options={{
          title: 'Itinerari',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 30 : 26} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 30 : 26} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}