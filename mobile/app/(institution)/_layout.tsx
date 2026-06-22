import React, { useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, Package, BarChart3, Truck } from 'lucide-react-native';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppDrawer, type DrawerItem } from '@/components/layout/AppDrawer';
import { colors, screenStyle } from '@/constants/layout';

const institutionDrawerItems: DrawerItem[] = [
  { label: 'Início', href: '/(institution)/dashboard', icon: Home },
  { label: 'Famílias', href: '/(institution)/families', icon: Users },
  { label: 'Entregas', href: '/(institution)/delivery', icon: Package },
  { label: 'Fornecedores', href: '/(institution)/suppliers', icon: Truck },
  { label: 'Relatórios', href: '/(institution)/reports', icon: BarChart3 },
];

export default function InstitutionLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ProtectedLayout allowedRoles={['institution']}>
      <View style={screenStyle}>
        <AppHeader showMenu onMenuPress={() => setDrawerOpen(true)} />
        <AppDrawer
          visible={drawerOpen}
          title="Menu"
          items={institutionDrawerItems}
          onClose={() => setDrawerOpen(false)}
        />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.muted,
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
            sceneStyle: screenStyle,
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Início',
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="families/index"
            options={{
              title: 'Famílias',
              tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="delivery"
            options={{
              title: 'Entregas',
              tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="reports"
            options={{
              title: 'Relatórios',
              tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="suppliers"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </View>
    </ProtectedLayout>
  );
}
