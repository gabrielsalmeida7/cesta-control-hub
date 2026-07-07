import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerTintColor: '#004E64' }}>
      <Stack.Screen name="politica-privacidade" options={{ title: 'Política de Privacidade' }} />
      <Stack.Screen name="portal-titular" options={{ title: 'Portal do Titular' }} />
    </Stack>
  );
}
