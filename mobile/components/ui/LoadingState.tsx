import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { screenStyle, colors } from '@/constants/layout';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton';
  rows?: number;
}

export function LoadingState({
  message = 'Carregando...',
  variant = 'spinner',
  rows = 3,
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <View className="gap-3 p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-lg" />
        ))}
      </View>
    );
  }

  return (
    <View style={screenStyle} className="items-center justify-center gap-3 py-12">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="text-sm text-muted-foreground">{message}</Text>
    </View>
  );
}
