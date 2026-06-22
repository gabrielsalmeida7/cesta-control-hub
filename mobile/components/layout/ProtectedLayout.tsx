import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/LoadingState';
import { getHomeRouteForRole } from '@/utils/authRedirect';
import { screenStyle } from '@/constants/layout';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'institution')[];
}

export function ProtectedLayout({ children, allowedRoles }: ProtectedLayoutProps) {
  const { user, session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={screenStyle}>
        <LoadingState message="Carregando perfil..." />
      </View>
    );
  }

  if (!user || !session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Redirect href={getHomeRouteForRole(profile.role)} />;
  }

  if (allowedRoles && !profile) {
    return (
      <View style={screenStyle}>
        <LoadingState message="Carregando perfil..." />
      </View>
    );
  }

  return <>{children}</>;
}
