import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/cn';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <View className={cn('rounded-lg border border-border bg-card shadow-sm', className)}>
      {children}
    </View>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn('p-4 pb-2', className)}>{children}</View>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <Text className={cn('text-lg font-semibold text-foreground', className)}>{children}</Text>;
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <Text className={cn('text-sm text-muted-foreground', className)}>{children}</Text>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn('p-4 pt-0', className)}>{children}</View>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn('flex-row items-center p-4 pt-0', className)}>{children}</View>;
}
