import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

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
    setLoading(true);

    const { error } = await signIn(email, password);
    
    setLoading(false);
    
    if (error) {
      // Error handling is done in the signIn hook via toast
    }
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
          <CardHeader className="space-y-1 text-center">
            <img 
              src="/CestaJustaLogo.svg" 
              alt="Logo" 
              className="w-[330px] h-[130px] mx-auto mb-0"
            />
            <CardTitle className="text-2xl font-bold tracking-tight">
              Sistema de Controle de Alimentos
            </CardTitle>
          </CardHeader>
          
          <CardContent>
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
                disabled={loading || authLoading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

          </CardContent>
          
          <CardFooter className="flex justify-center">
            <div className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} - Secretaria de Assistência Social - Banco de Alimentos - Prefeitura Municipal de Araguari
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
