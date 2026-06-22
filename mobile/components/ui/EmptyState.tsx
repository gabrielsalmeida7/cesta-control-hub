import React from 'react';
import { View, Text } from 'react-native';
import { Inbox } from 'lucide-react-native';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'Nenhum registro encontrado',
  description = 'Não há dados para exibir no momento.',
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-2 px-6 py-12">
      <Inbox size={40} color="#9CA3AF" />
      <Text className="text-center text-base font-medium text-foreground">{title}</Text>
      <Text className="text-center text-sm text-muted-foreground">{description}</Text>
    </View>
  );
}
