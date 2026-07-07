import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { screenStyle } from '@/constants/layout';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error || !data.session) {
        setSessionError(
          'Link inválido ou expirado. Solicite um novo email de redefinição de senha.'
        );
        setSessionReady(true);
        return;
      }

      setSessionReady(true);
    };

    void verifySession();

    return () => {
      active = false;
    };
  }, []);

  const handleReset = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: 'Senha fraca',
        description: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }

    await supabase.auth.signOut();

    toast({ title: 'Sucesso', description: 'Senha atualizada com sucesso. Faça login novamente.' });
    router.replace('/(auth)/login');
  };

  if (!sessionReady) {
    return (
      <View style={screenStyle}>
        <LoadingState message="Validando link de recuperação..." />
      </View>
    );
  }

  if (sessionError) {
    return (
      <View style={screenStyle} className="p-4">
        <ErrorState
          title="Link inválido"
          description={sessionError}
          onRetry={() => router.replace('/(auth)/login')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={screenStyle}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Redefinir Senha</CardTitle>
          <Text className="text-sm text-muted-foreground">
            Defina uma nova senha para sua conta.
          </Text>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="gap-2">
            <Label>Nova senha</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Mínimo 6 caracteres"
            />
          </View>
          <View className="gap-2">
            <Label>Confirmar senha</Label>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <Button onPress={handleReset} loading={loading}>
            Atualizar senha
          </Button>
          <Button variant="ghost" onPress={() => router.replace('/(auth)/login')}>
            Voltar ao login
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
