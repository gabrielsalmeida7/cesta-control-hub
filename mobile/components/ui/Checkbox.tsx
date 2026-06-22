import React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '@/lib/cn';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn('h-5 w-5 items-center justify-center rounded border', className, {
        'border-primary bg-primary': checked,
        'border-border bg-white': !checked,
        'opacity-50': disabled,
      })}
    >
      {checked ? <Check size={14} color="#fff" /> : null}
    </Pressable>
  );
}
