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
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in (simplified - let ProtectedRoute handle most of the logic)
  useEffect(() => {
    // Only redirect if we're not loading and user is authenticated
    // The ProtectedRoute will handle redirecting away from /login if user is logged in
    if (!authLoading && user && profile) {
      if (import.meta.env.DEV) {
        console.log("[LOGIN]", "User already authenticated, redirecting to home", {
          email: user.email,
          role: profile.role,
          timestamp: new Date().toISOString()
        });
      }
      setLoading(false);
      navigate("/", { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const action = isSignup ? signUp : signIn;
    const { error } = await action(email, password);
    
    // For signup, the hook will show a toast to verify email
    if (!error && !isSignup) {
      // Let the auth state change handle the redirect
    }

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
              src="/lovable-uploads/CestaJusta.PNG" 
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
                    onClick={async (e) => {
                      e.preventDefault();
                      const { supabase } = await import("@/integrations/supabase/client");
                      const { useToast } = await import("@/hooks/use-toast");
                      const { toast } = useToast();
                      if (!email) {
                        toast({ title: "Informe seu email", description: "Preencha o campo de email para receber o link de redefinição.", variant: "destructive" });
                        return;
                      }
                      try {
                        const redirectTo = `${window.location.origin}/reset-password`;
                        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
                        if (error) {
                          toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
                        } else {
                          toast({ title: "Email enviado", description: "Verifique sua caixa de entrada para redefinir a senha." });
                        }
                      } catch (err: any) {
                        toast({ title: "Erro inesperado", description: err?.message || String(err), variant: "destructive" });
                      }
                    }}
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
              
              {error && (
                <Alert variant="destructive" className="w-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={loading || authLoading}
              >
                {loading ? (isSignup ? "Cadastrando..." : "Entrando...") : (isSignup ? "Cadastrar" : "Entrar")}
              </Button>

              <p className="text-center text-sm text-gray-600 mt-2">
                {isSignup ? (
                  <>
                    Já tem uma conta?{' '}
                    <a href="#" className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); setIsSignup(false); }}>
                      Entrar
                    </a>
                  </>
                ) : (
                  <>
                    Não tem conta?{' '}
                    <a href="#" className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); setIsSignup(true); }}>
                      Cadastre-se
                    </a>
                  </>
                )}
              </p>
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
