import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LogOut, Menu } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { CestaLoginMark } from '@/components/brand/BrandLogos';
import { colors } from '@/constants/layout';

interface AppHeaderProps {
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export function AppHeader({ onMenuPress, showMenu }: AppHeaderProps) {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const roleLabel = profile.role === 'admin' ? 'Administrador' : 'Instituição';

  return (
    <View style={{ backgroundColor: colors.background }} className="border-b border-border px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          {showMenu && onMenuPress ? (
            <Pressable onPress={onMenuPress} className="p-1">
              <Menu size={22} color="#004E64" />
            </Pressable>
          ) : null}
          <View className="rounded-lg bg-primary p-2">
            <CestaLoginMark width={20} height={18} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
              {profile.full_name || profile.email}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {roleLabel} · Banco de Alimentos - Araguari
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleLogout}
          accessibilityLabel="Sair do sistema"
          className="ml-2 flex-row items-center gap-1 rounded-lg border border-border px-2 py-2"
        >
          <LogOut size={16} color="#EF476F" />
          <Text className="text-xs text-danger">Sair</Text>
        </Pressable>
      </View>
    </View>
  );
}
