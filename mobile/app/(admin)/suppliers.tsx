import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { InstitutionPicker } from '@/components/domain/InstitutionPicker';
import { SuppliersManagement } from '@/components/domain/SuppliersManagement';
import { useInstitutions } from '@/hooks/useInstitutions';

export default function AdminSuppliersScreen() {
  const { data: institutions = [] } = useInstitutions();
  const [institutionId, setInstitutionId] = useState('');

  const selectedInstitution = (institutions as Array<{ id: string; name: string }>).find(
    (item) => item.id === institutionId
  );

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Pressable className="mb-4 flex-row items-center gap-2" onPress={() => router.back()}>
        <ArrowLeft size={20} color="#004E64" />
        <Text className="text-primary">Voltar</Text>
      </Pressable>

      <Text className="text-xl font-bold">Fornecedores (Admin)</Text>
      <Text className="mt-1 text-sm text-muted-foreground">
        Selecione a instituição para gerenciar fornecedores, produtos e estoque.
      </Text>

      <View className="mt-4 gap-4">
        <InstitutionPicker
          institutions={institutions as Array<{ id: string; name: string }>}
          selectedId={institutionId}
          onSelect={setInstitutionId}
        />

        {institutionId ? (
          <SuppliersManagement
            institutionId={institutionId}
            institutionName={selectedInstitution?.name}
          />
        ) : (
          <Text className="text-muted-foreground">
            Escolha uma instituição para exibir o módulo de fornecedores.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
