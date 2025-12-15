import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Verificar se já aceitou a política (localStorage)
  useEffect(() => {
    const hasAcceptedPolicy = localStorage.getItem('policy_accepted');
    if (hasAcceptedPolicy === 'true') {
      setAcceptedPolicy(true);
    } else {
      // Mostrar modal na primeira vez
      setShowPolicyModal(true);
    }
  }, []);

  // Redirect if already logged in based on user role
  useEffect(() => {
    // Only redirect if we're not loading and user is authenticated with profile
    if (!authLoading && user && profile) {
      if (import.meta.env.DEV) {
        console.log("[LOGIN]", "User already authenticated, redirecting based on role", {
          email: user.email,
          role: profile.role,
          timestamp: new Date().toISOString()
        });
      }
      setLoading(false);
      
      // Redirect based on role
      if (profile.role === 'admin') {
        navigate("/", { replace: true });
      } else if (profile.role === 'institution') {
        navigate("/institution/dashboard", { replace: true });
      } else {
        // Fallback to home if role is unknown
        navigate("/", { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se aceitou a política
    if (!acceptedPolicy) {
      toast({
        title: "Política de Privacidade",
        description: "Você precisa aceitar a Política de Privacidade para fazer login.",
        variant: "destructive"
      });
      setShowPolicyModal(true);
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);
    
    setLoading(false);
    
    if (error) {
      // Error handling is done in the signIn hook via toast
    }
  };

  const handleAcceptPolicy = () => {
    setAcceptedPolicy(true);
    localStorage.setItem('policy_accepted', 'true');
    setShowPolicyModal(false);
    toast({
      title: "Política Aceita",
      description: "Você pode agora fazer login no sistema.",
    });
  };

  const handleForgotPassword = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (!email) {
      toast({ 
        title: "Email necessário", 
        description: "Por favor, informe seu email para receber o link de redefinição de senha.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo 
      });
      
      if (error) {
        toast({ 
          title: "Erro ao enviar email", 
          description: error.message, 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Email enviado", 
          description: "Verifique sua caixa de entrada. Um link para redefinir sua senha foi enviado para o email informado." 
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
      toast({ 
        title: "Erro inesperado", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row">
      {/* Modal de Política de Privacidade */}
      <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Política de Privacidade e Proteção de Dados</DialogTitle>
            <DialogDescription>
              Para utilizar o sistema, você precisa ler e aceitar nossa Política de Privacidade, 
              em conformidade com a LGPD (Lei nº 13.709/2018).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-900 font-medium mb-2">
                Nossa política explica:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
                <li>Quais dados coletamos</li>
                <li>Como protegemos suas informações</li>
                <li>Seus direitos como titular de dados</li>
                <li>Como exercer seus direitos</li>
              </ul>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="accept-policy" 
                checked={acceptedPolicy}
                onCheckedChange={(checked) => setAcceptedPolicy(checked as boolean)}
              />
              <Label htmlFor="accept-policy" className="text-sm leading-relaxed cursor-pointer">
                Li e aceito a{" "}
                <a 
                  href="/politica-privacidade" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Política de Privacidade
                </a>
                {" "}do sistema.
              </Label>
            </div>

            <Button 
              onClick={handleAcceptPolicy}
              disabled={!acceptedPolicy}
              className="w-full"
            >
              Aceitar e Continuar
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Você pode revisar a política a qualquer momento.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seção Esquerda - Imagem de Fundo com Texto */}
      <div className="hidden md:flex md:w-1/2 h-screen relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/CestaJustaLogin.png')"
        }}
      >
        {/* Overlay escuro para legibilidade */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Conteúdo sobreposto */}
        <div className="relative z-10 flex flex-col justify-center items-start p-8 md:p-12 text-white">
          <div className="mb-6">
            <div className="mb-4">
              <img 
                src="/CestaLogin.svg" 
                alt="Logo Cesta Justa" 
                className="w-auto h-12"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Cesta Justa</h1>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Sistema de Controle de Alimentos</h2>
            <p className="text-lg md:text-xl text-white/90 max-w-md">
              Gestão responsável e transparente para garantir acesso digno à alimentação.
            </p>
          </div>
        </div>
      </div>

      {/* Seção Direita - Formulário de Login */}
      <div className="flex-1 h-screen overflow-hidden flex items-center justify-center p-4 md:p-6 bg-gray-50">
        <Card className="w-full max-w-md bg-white shadow-xl rounded-lg max-h-[calc(100vh-2rem)] flex flex-col">
          <CardHeader className="space-y-1 text-center px-6 pt-6 pb-4 flex-shrink-0">
            <img 
              src="/CestaJustaLogo.svg" 
              alt="Logo" 
              className="w-full max-w-[240px] sm:max-w-[280px] h-auto mx-auto mb-3"
            />
            <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
              Sistema de Controle de Alimentos
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-6 sm:px-8 flex-1">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a 
                    href="#" 
                    className="text-sm text-primary hover:underline"
                    onClick={handleForgotPassword}
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white" 
                disabled={loading || authLoading || !acceptedPolicy}
              >
                {loading ? "Entrando..." : "Entrar no sistema"}
              </Button>
            </form>

            {/* Links LGPD */}
            <div className="mt-4 pt-3 border-t space-y-2">
              <p className="text-xs text-center text-gray-500 mb-1">
                Informações sobre Proteção de Dados:
              </p>
              <div className="flex flex-col gap-1.5">
                <a 
                  href="/politica-privacidade" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-center flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Política de Privacidade
                </a>
                <a 
                  href="/portal-titular" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-center flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Portal do Titular (Exercer Direitos LGPD)
                </a>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center px-6 pb-4 flex-shrink-0">
            <div className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} - Secretaria de Assistência Social - Banco de Alimentos - Prefeitura Municipal de Araguari
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
