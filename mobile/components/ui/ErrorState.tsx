import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Erro ao carregar dados',
  description = 'Não foi possível buscar as informações. Tente novamente.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-12">
      <AlertCircle size={40} color="#EF476F" />
      <Text className="text-center text-base font-medium text-foreground">{title}</Text>
      <Text className="text-center text-sm text-muted-foreground">{description}</Text>
      {onRetry ? (
        <Button variant="outline" onPress={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </View>
  );
}
