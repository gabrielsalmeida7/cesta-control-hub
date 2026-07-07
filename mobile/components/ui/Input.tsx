import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';

interface InputProps extends TextInputProps {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <TextInput
      className={cn(
        'h-11 rounded-lg border border-border bg-white px-3 text-base text-foreground',
        className
      )}
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  );
}
