import React, { useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Building2, Users, Package, BarChart3, Truck } from 'lucide-react-native';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppDrawer, type DrawerItem } from '@/components/layout/AppDrawer';
import { colors, screenStyle } from '@/constants/layout';

const adminDrawerItems: DrawerItem[] = [
  { label: 'Início', href: '/(admin)', icon: Home },
  { label: 'Instituições', href: '/(admin)/institutions', icon: Building2 },
  { label: 'Famílias', href: '/(admin)/families', icon: Users },
  { label: 'Entregas', href: '/(admin)/delivery', icon: Package },
  { label: 'Fornecedores', href: '/(admin)/suppliers', icon: Truck },
  { label: 'Relatórios', href: '/(admin)/reports', icon: BarChart3 },
];

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ProtectedLayout allowedRoles={['admin']}>
      <View style={screenStyle}>
        <AppHeader showMenu onMenuPress={() => setDrawerOpen(true)} />
        <AppDrawer
          visible={drawerOpen}
          title="Menu Admin"
          items={adminDrawerItems}
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
            name="index"
            options={{
              title: 'Início',
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="institutions"
            options={{
              title: 'Instituições',
              tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="families"
            options={{
              title: 'Famílias',
              tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="reports"
            options={{
              title: 'Relatórios',
              tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
            }}
          />
          <Tabs.Screen name="delivery" options={{ href: null }} />
          <Tabs.Screen name="suppliers" options={{ href: null }} />
        </Tabs>
      </View>
    </ProtectedLayout>
  );
}
