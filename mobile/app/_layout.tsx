import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ActivityIndicator, View } from 'react-native';
import { ToastProvider } from '@/hooks/useToast';
import { AuthProvider } from '@/hooks/useAuth';
import { PasswordRecoveryListener } from '@/components/auth/PasswordRecoveryListener';
import { screenStyle, colors } from '@/constants/layout';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash já pode ter sido escondida em hot reload
});

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const isReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={screenStyle} className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={screenStyle}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <PasswordRecoveryListener />
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: screenStyle,
                  animation: 'default',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(institution)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="(public)" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
