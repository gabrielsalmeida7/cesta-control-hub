import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextInputProps {
  className?: string;
}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      className={cn(
        'min-h-[100px] rounded-lg border border-border bg-white px-3 py-2 text-base text-foreground',
        className
      )}
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  );
}
