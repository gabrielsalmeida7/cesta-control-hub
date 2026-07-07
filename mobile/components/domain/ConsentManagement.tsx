import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Checkbox } from '@/components/ui/Checkbox';

interface ConsentManagementProps {
  consentGiven: boolean;
  termSigned: boolean;
  onConsentChange: (given: boolean) => void;
  onTermSignedChange: (signed: boolean) => void;
  disabled?: boolean;
}

export function ConsentManagement({
  consentGiven,
  termSigned,
  onConsentChange,
  onTermSignedChange,
  disabled,
}: ConsentManagementProps) {
  const router = useRouter();

  return (
    <View className="gap-4 rounded-lg border border-border bg-muted/30 p-4">
      <View className="flex-row items-center gap-2">
        <ShieldCheck size={18} color="#004E64" />
        <Text className="font-semibold text-foreground">Consentimento LGPD</Text>
      </View>

      <View className="flex-row items-start gap-3">
        <Checkbox
          checked={consentGiven}
          onCheckedChange={onConsentChange}
          disabled={disabled}
        />
        <Text className="flex-1 text-sm text-foreground">
          Declaro que li e aceito a{' '}
          <Text
            className="text-primary underline"
            onPress={() => router.push('/(public)/politica-privacidade')}
          >
            Política de Privacidade
          </Text>{' '}
          e autorizo o tratamento dos meus dados pessoais.
        </Text>
      </View>

      <View className="flex-row items-start gap-3 border-t border-border pt-3">
        <Checkbox
          checked={termSigned}
          onCheckedChange={onTermSignedChange}
          disabled={disabled}
        />
        <Text className="flex-1 text-sm text-foreground">
          Confirmo que o termo de consentimento foi impresso, assinado fisicamente pelo titular e
          arquivado em 2 vias.
        </Text>
      </View>

      <Text className="text-xs text-muted-foreground">
        O consentimento digital é necessário para cadastrar a família. O upload do termo assinado
        será disponibilizado em uma versão futura.
      </Text>
    </View>
  );
}
