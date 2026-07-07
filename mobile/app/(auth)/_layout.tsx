import { Stack } from 'expo-router';
import { screenStyle } from '@/constants/layout';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: screenStyle,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
