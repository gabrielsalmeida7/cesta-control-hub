import React, { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  searchable?: boolean;
}

export function Select({
  options,
  value,
  onValueChange,
  label,
  placeholder = 'Selecione uma opção',
  searchable = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = options.find((item) => item.value === value);
  const filtered = searchable
    ? options.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <View className="gap-2">
      {label ? <Label>{label}</Label> : null}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-lg border border-border bg-white px-3 py-3"
      >
        <Text className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color="#6B7280" />
      </Pressable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{label ?? 'Selecionar'}</DialogTitle>
            <DialogDescription>Escolha uma opção da lista</DialogDescription>
          </DialogHeader>
          {searchable ? (
            <Input
              placeholder="Buscar..."
              value={search}
              onChangeText={setSearch}
            />
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            style={{ maxHeight: 280 }}
            renderItem={({ item }) => (
              <Pressable
                className={`mb-1 rounded-lg border px-3 py-3 ${
                  value === item.value ? 'border-primary bg-primary/10' : 'border-border'
                }`}
                onPress={() => {
                  onValueChange(item.value);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <Text className="font-medium">{item.label}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text className="py-4 text-center text-muted-foreground">Nenhuma opção encontrada</Text>
            }
          />
          <Button variant="outline" onPress={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </View>
  );
}
