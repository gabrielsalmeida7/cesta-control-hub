import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link, Stack, router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { CestaJustaLogo } from '@/components/brand/BrandLogos';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View className="flex-1 items-center justify-center bg-background px-6">
        <CestaJustaLogo width={200} className="mb-6" />
        <Text className="text-2xl font-bold text-foreground">Página não encontrada</Text>
        <Text className="mt-2 text-center text-muted-foreground">
          O endereço que você tentou acessar não existe ou foi movido.
        </Text>
        <View className="mt-6 w-full max-w-xs gap-3">
          <Button onPress={() => router.replace('/')}>Ir para o início</Button>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-center text-sm text-primary">Voltar ao login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </>
  );
}
