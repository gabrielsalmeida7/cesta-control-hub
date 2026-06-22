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

interface InstitutionOption {
  id: string;
  name: string;
}

interface InstitutionPickerProps {
  institutions: InstitutionOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  label?: string;
  placeholder?: string;
}

export function InstitutionPicker({
  institutions,
  selectedId,
  onSelect,
  label = 'Instituição',
  placeholder = 'Selecione uma instituição',
}: InstitutionPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = institutions.find((item) => item.id === selectedId);
  const filtered = institutions.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-lg border border-border bg-white px-3 py-3"
      >
        <Text className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected?.name ?? placeholder}
        </Text>
        <ChevronDown size={18} color="#6B7280" />
      </Pressable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Instituição</DialogTitle>
            <DialogDescription>Escolha a instituição para continuar</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Buscar instituição..."
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 280 }}
            renderItem={({ item }) => (
              <Pressable
                className={`mb-1 rounded-lg border px-3 py-3 ${
                  selectedId === item.id ? 'border-primary bg-primary/10' : 'border-border'
                }`}
                onPress={() => {
                  onSelect(item.id);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <Text className="font-medium">{item.name}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text className="py-4 text-center text-muted-foreground">
                Nenhuma instituição encontrada
              </Text>
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
