import React from 'react';
import { Text, type TextProps } from 'react-native';
import { cn } from '@/lib/cn';

export function Label({ className, children, ...props }: TextProps & { className?: string }) {
  return (
    <Text className={cn('text-sm font-medium text-foreground', className)} {...props}>
      {children}
    </Text>
  );
}
