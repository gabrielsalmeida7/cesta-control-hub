import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <View className={cn('animate-pulse rounded-md bg-muted', className)} />;
}
