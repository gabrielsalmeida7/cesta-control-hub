import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  destructive: 'bg-danger',
  outline: 'border border-border bg-transparent',
};

const textStyles: Record<BadgeVariant, string> = {
  default: 'text-white',
  secondary: 'text-secondary-foreground',
  success: 'text-white',
  destructive: 'text-white',
  outline: 'text-foreground',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <View className={cn('self-start rounded-full px-2.5 py-0.5', variantStyles[variant], className)}>
      <Text className={cn('text-xs font-medium', textStyles[variant])}>{children}</Text>
    </View>
  );
}
