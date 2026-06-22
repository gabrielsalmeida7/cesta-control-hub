import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/LoadingState';
import { getHomeRouteForRole } from '@/utils/authRedirect';
import { screenStyle } from '@/constants/layout';

export default function Index() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={screenStyle}>
        <LoadingState message="Verificando sessão..." />
      </View>
    );
  }

  if (!user || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={getHomeRouteForRole(profile.role)} />;
}
