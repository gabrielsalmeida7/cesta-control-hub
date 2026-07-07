import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { formatCpf } from '@/utils/documentFormat';
import type { FamilyWithMultipleInstitutions } from '@/hooks/useAlerts';

interface FraudAlertCardProps {
  family: FamilyWithMultipleInstitutions;
  onPress: () => void;
}

export function FraudAlertCard({ family, onPress }: FraudAlertCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-2 rounded-lg border border-danger/30 bg-danger/5 p-3 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <AlertTriangle size={16} color="#EF476F" />
            <Text className="font-medium text-foreground">{family.name}</Text>
            <Badge variant="destructive">{family.institutions.length} inst.</Badge>
          </View>
          <Text className="text-sm text-muted-foreground">{family.contact_person}</Text>
          {family.cpf ? (
            <Text className="text-xs text-muted-foreground">CPF: {formatCpf(family.cpf)}</Text>
          ) : null}
        </View>
        <ChevronRight size={18} color="#6B7280" />
      </View>
    </Pressable>
  );
}
