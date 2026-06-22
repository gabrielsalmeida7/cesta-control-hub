import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Link } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { CestaJustaLogo, CestaLoginMark } from '@/components/brand/BrandLogos';
import { useAuth, getPolicyAccepted, setPolicyAccepted } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { getHomeRouteForRole } from '@/utils/authRedirect';
import { colors, screenStyle } from '@/constants/layout';
import { getPasswordResetRedirectUrl } from '@/utils/authDeepLink';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedPolicy, setAcceptedPolicyState] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    getPolicyAccepted().then((accepted) => {
      if (accepted) {
        setAcceptedPolicyState(true);
      } else {
        setShowPolicyModal(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!authLoading && user && profile) {
      setLoading(false);
      router.replace(getHomeRouteForRole(profile.role));
    }
  }, [user, profile, authLoading]);

  const handleLogin = async () => {
    if (!acceptedPolicy) {
      toast({
        title: 'Política de Privacidade',
        description: 'Você precisa aceitar a Política de Privacidade para fazer login.',
        variant: 'destructive',
      });
      setShowPolicyModal(true);
      return;
    }

    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  const handleAcceptPolicy = async () => {
    setAcceptedPolicyState(true);
    await setPolicyAccepted();
    setShowPolicyModal(false);
    toast({
      title: 'Política Aceita',
      description: 'Você pode agora fazer login no sistema.',
    });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Email necessário',
        description: 'Informe seu email para receber o link de redefinição de senha.',
        variant: 'destructive',
      });
      return;
    }

    const redirectTo = getPasswordResetRedirectUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      toast({ title: 'Erro ao enviar email', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={screenStyle}
    >
      <ScrollView
        style={screenStyle}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ backgroundColor: colors.primary }} className="px-6 pb-10 pt-12">
          <CestaLoginMark width={56} className="mb-4" />
          <Text className="text-3xl font-bold text-white">Cesta Justa</Text>
          <Text className="mt-1 text-lg font-semibold text-white/95">
            Sistema de Controle de Alimentos
          </Text>
          <Text className="mt-3 max-w-sm text-sm text-white/85">
            Gestão responsável e transparente para garantir acesso digno à alimentação.
          </Text>
        </View>

        <View className="-mt-6 px-4 pb-8">
          <Card className="mx-auto w-full max-w-md shadow-lg">
            <CardHeader className="items-center pb-2">
              <CestaJustaLogo width={240} className="mb-2" />
              <CardTitle className="text-center text-lg">
                Sistema de Controle de Alimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-2">
                <Label>Email</Label>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Email"
                />
              </View>
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Label>Senha</Label>
                  <Pressable onPress={handleForgotPassword}>
                    <Text className="text-sm text-primary">Esqueceu a senha?</Text>
                  </Pressable>
                </View>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Digite sua senha"
                />
              </View>
              <Button
                onPress={handleLogin}
                loading={loading || authLoading}
                disabled={!acceptedPolicy}
                className="w-full"
              >
                Entrar no sistema
              </Button>
              <View className="mt-2 gap-2 border-t border-border pt-3">
                <Text className="text-center text-xs text-muted-foreground">
                  Informações sobre Proteção de Dados:
                </Text>
                <Link href="/(public)/politica-privacidade" asChild>
                  <Pressable>
                    <Text className="text-center text-xs text-primary">Política de Privacidade</Text>
                  </Pressable>
                </Link>
                <Link href="/(public)/portal-titular" asChild>
                  <Pressable>
                    <Text className="text-center text-xs text-primary">
                      Portal do Titular (LGPD)
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </CardContent>
            <CardFooter className="justify-center pb-6">
              <Text className="text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} - Prefeitura Municipal de Araguari
              </Text>
            </CardFooter>
          </Card>
        </View>
      </ScrollView>

      <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Política de Privacidade e Proteção de Dados</DialogTitle>
            <DialogDescription>
              Para utilizar o sistema, você precisa aceitar nossa Política de Privacidade, em
              conformidade com a LGPD (Lei nº 13.709/2018).
            </DialogDescription>
          </DialogHeader>
          <View className="rounded-md bg-primary/10 p-4">
            <Text className="text-sm text-primary">
              Nossa política explica quais dados coletamos, como protegemos suas informações e seus
              direitos como titular de dados.
            </Text>
          </View>
          <Pressable
            className="flex-row items-center gap-2"
            onPress={() => setAcceptedPolicyState(!acceptedPolicy)}
          >
            <View
              className={`h-5 w-5 rounded border ${acceptedPolicy ? 'bg-primary border-primary' : 'border-border'}`}
            />
            <Text className="flex-1 text-sm">
              Li e aceito a Política de Privacidade do sistema.
            </Text>
          </Pressable>
          <Button onPress={handleAcceptPolicy} disabled={!acceptedPolicy}>
            Aceitar e Continuar
          </Button>
        </DialogContent>
      </Dialog>
    </KeyboardAvoidingView>
  );
}
