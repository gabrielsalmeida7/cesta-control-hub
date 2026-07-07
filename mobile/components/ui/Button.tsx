import React from 'react';
import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-primary active:opacity-90',
  secondary: 'bg-secondary active:opacity-90',
  ghost: 'bg-transparent active:bg-muted',
  destructive: 'bg-danger active:opacity-90',
  outline: 'border border-border bg-white active:bg-muted',
};

const textVariantStyles: Record<ButtonVariant, string> = {
  default: 'text-white',
  secondary: 'text-secondary-foreground',
  ghost: 'text-foreground',
  destructive: 'text-white',
  outline: 'text-foreground',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-11 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-12 px-6',
  icon: 'h-10 w-10',
};

export function Button({
  variant = 'default',
  size = 'default',
  loading,
  children,
  className,
  textClassName,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        'flex-row items-center justify-center rounded-lg',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-50',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#004E64' : '#fff'} />
      ) : typeof children === 'string' ? (
        <Text className={cn('text-sm font-semibold', textVariantStyles[variant], textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
