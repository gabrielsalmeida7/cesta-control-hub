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
    <div className="min-h-screen flex flex-col bg-blue-600 relative">
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

      {/* Marca d'água da imagem */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
        //style={{ 
          //backgroundImage: "url('/lovable-uploads/1cb439f6-d870-455d-a7a7-2ab401d03c6b.png')",
          //backgroundSize: "contain",
          //backgroundRepeat: "no-repeat",
          //backgroundPosition: "center" 
        //}}
      />
      
      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 text-center px-4 pt-6 pb-4">
            <img 
              src="/CestaJustaLogo.svg" 
              alt="Logo" 
              className="w-full max-w-[280px] sm:max-w-[330px] h-auto mx-auto mb-2"
            />
            <CardTitle className="text-lg sm:text-2xl font-bold tracking-tight">
              Sistema de Controle de Alimentos
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
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
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={loading || authLoading || !acceptedPolicy}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            {/* Links LGPD */}
            <div className="mt-6 pt-4 border-t space-y-2">
              <p className="text-xs text-center text-gray-500 mb-2">
                Informações sobre Proteção de Dados:
              </p>
              <div className="flex flex-col gap-2">
                <a 
                  href="/politica-privacidade" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-center"
                >
                  📄 Política de Privacidade
                </a>
                <a 
                  href="/portal-titular" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-center"
                >
                  👤 Portal do Titular (Exercer Direitos LGPD)
                </a>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center px-4 pb-4">
            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} - Secretaria de Assistência Social - Banco de Alimentos - Prefeitura Municipal de Araguari
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
