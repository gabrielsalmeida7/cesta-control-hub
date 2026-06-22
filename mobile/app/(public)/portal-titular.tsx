import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { AlertCircle, Mail } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTitularPortal, type TitularRequestType } from '@/hooks/useTitularPortal';
import { screenStyle } from '@/constants/layout';

export default function TitularPortalScreen() {
  const { submitRequest, isSubmitting, formatCpfInput, requestOptions } = useTitularPortal();
  const [cpf, setCpf] = useState('');
  const [requestType, setRequestType] = useState<TitularRequestType | ''>('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!cpf || !requestType) {
      return;
    }

    const success = await submitRequest({ cpf, requestType, message });
    if (success) {
      setCpf('');
      setRequestType('');
      setMessage('');
    }
  };

  const handleClear = () => {
    setCpf('');
    setRequestType('');
    setMessage('');
  };

  return (
    <ScrollView style={screenStyle} contentContainerClassName="gap-4 p-4 pb-8">
      <View className="items-center gap-1">
        <Text className="text-center text-2xl font-bold text-foreground">Portal do Titular de Dados</Text>
        <Text className="text-center text-sm text-muted-foreground">
          Exerça seus direitos garantidos pela LGPD (Lei nº 13.709/2018)
        </Text>
      </View>

      <View className="flex-row gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <AlertCircle size={18} color="#004E64" />
        <Text className="flex-1 text-sm text-primary">
          Todas as solicitações serão analisadas e respondidas em até 15 dias úteis.
        </Text>
      </View>

      <View className="gap-3">
        {requestOptions.map((right) => (
          <Pressable
            key={right.id}
            onPress={() => setRequestType(right.id)}
            className={`rounded-lg border p-3 ${
              requestType === right.id ? 'border-primary border-2 bg-primary/5' : 'border-border bg-white'
            }`}
          >
            <Text className="font-semibold text-foreground">{right.label}</Text>
            <Text className="mt-1 text-sm text-muted-foreground">{right.detail}</Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <CardHeader>
          <View className="flex-row items-center gap-2">
            <Mail size={18} color="#004E64" />
            <CardTitle>Formulário de Solicitação</CardTitle>
          </View>
        </CardHeader>
        <CardContent className="gap-3">
          <View className="gap-2">
            <Label>CPF do Titular *</Label>
            <Input
              value={cpf}
              onChangeText={(value) => setCpf(formatCpfInput(value))}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              maxLength={14}
            />
            <Text className="text-xs text-muted-foreground">
              Usaremos seu CPF para localizar seus dados em nosso sistema
            </Text>
          </View>

          <View className="gap-2">
            <Label>Tipo de solicitação *</Label>
            <Text className="text-sm text-foreground">
              {requestType
                ? requestOptions.find((option) => option.id === requestType)?.label
                : 'Selecione um direito acima'}
            </Text>
          </View>

          <View className="gap-2">
            <Label>Mensagem / Detalhes (opcional)</Label>
            <Textarea
              value={message}
              onChangeText={setMessage}
              placeholder="Descreva sua solicitação com mais detalhes, se necessário..."
              numberOfLines={4}
            />
          </View>

          <View className="flex-row gap-2 pt-2">
            <Button variant="outline" className="flex-1" onPress={handleClear}>
              Limpar
            </Button>
            <Button
              className="flex-1"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!cpf || !requestType}
            >
              Enviar Solicitação
            </Button>
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato do DPO</CardTitle>
        </CardHeader>
        <CardContent className="gap-1">
          <Text className="text-sm text-foreground">Email: dpo@cestacontrolhub.com.br</Text>
          <Text className="text-sm text-foreground">Telefone: (34) 99999-0000</Text>
          <Text className="text-sm text-foreground">Horário: Segunda a Sexta, 9h às 18h</Text>
          <Text className="pt-2 text-xs text-muted-foreground">Prazo de resposta: até 15 dias úteis</Text>
        </CardContent>
      </Card>

      <Text className="text-center text-xs text-muted-foreground">
        Este portal está em conformidade com a Lei nº 13.709/2018 (LGPD) - Art. 18.{' '}
        <Text className="text-primary underline" onPress={() => router.push('/(public)/politica-privacidade')}>
          Política de Privacidade
        </Text>
      </Text>
    </ScrollView>
  );
}
