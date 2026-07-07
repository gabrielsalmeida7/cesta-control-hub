import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';

interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Tabs<T extends string>({ items, value, onChange }: TabsProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <Button
          key={item.id}
          size="sm"
          variant={value === item.id ? 'default' : 'outline'}
          onPress={() => onChange(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </View>
  );
}
