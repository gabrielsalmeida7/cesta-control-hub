
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, profile } = useAuth();

  // Redirect if already logged in OR after successful login
  useEffect(() => {
    if (user && profile) {
      if (import.meta.env.DEV) {
        console.log("[LOGIN]", "User authenticated, redirecting to home", {
          email: user.email,
          role: profile.role,
          loginSuccess,
          timestamp: new Date().toISOString()
        });
      }
      setLoading(false);
      setLoginSuccess(false);
      navigate("/");
    }
  }, [user, profile, navigate, loginSuccess]);

  // Effect adicional para garantir redirecionamento após login bem-sucedido
  // Verifica periodicamente se user e profile estão prontos após login
  useEffect(() => {
    if (!loginSuccess) return;

    if (import.meta.env.DEV) {
      console.log("[LOGIN]", "Login success detected, checking for user and profile", {
        hasUser: !!user,
        hasProfile: !!profile,
        timestamp: new Date().toISOString()
      });
    }

    // Se já tiver user e profile, navegar imediatamente
    if (user && profile) {
      if (import.meta.env.DEV) {
        console.log("[LOGIN]", "User and profile ready immediately, navigating", {
          email: user.email,
          role: profile.role,
          timestamp: new Date().toISOString()
        });
      }
      setLoading(false);
      setLoginSuccess(false);
      navigate("/");
      return;
    }

    // Se não tiver ainda, aguardar um pouco e verificar novamente
    const checkInterval = setInterval(() => {
      if (user && profile) {
        if (import.meta.env.DEV) {
          console.log("[LOGIN]", "User and profile ready after check, navigating", {
            email: user.email,
            role: profile.role,
            timestamp: new Date().toISOString()
          });
        }
        setLoading(false);
        setLoginSuccess(false);
        clearInterval(checkInterval);
        navigate("/");
      }
    }, 100);

    // Limpar intervalo após 5 segundos ou quando componente desmontar
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (window.location.pathname === '/login') {
        if (import.meta.env.DEV) {
          console.warn("[LOGIN]", "Check interval timeout - attempting navigation anyway", {
            hasUser: !!user,
            hasProfile: !!profile,
            timestamp: new Date().toISOString()
          });
        }
        setLoading(false);
        setLoginSuccess(false);
        navigate("/");
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [loginSuccess, user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (import.meta.env.DEV) {
      console.log("[LOGIN]", "Form submission initiated:", {
        email,
        timestamp: new Date().toISOString()
      });
    }

    // Clear previous errors
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      setLoading(false);
      if (import.meta.env.DEV) {
        console.warn("[LOGIN]", "Form submission failed: missing fields", {
          emailEmpty: !email,
          passwordEmpty: !password,
          timestamp: new Date().toISOString()
        });
      }
      return;
    }

    const { error: signInError } = await signIn(email, password);
    
    if (signInError) {
      if (import.meta.env.DEV) {
        console.error("[LOGIN]", "Form submission error:", {
          error: signInError.message,
          email,
          timestamp: new Date().toISOString()
        });
      }
      setError(signInError.message || "Erro ao fazer login. Tente novamente.");
      setLoading(false);
      setLoginSuccess(false);
    } else {
      if (import.meta.env.DEV) {
        console.log("[LOGIN]", "Form submission successful, waiting for profile fetch", {
          email,
          timestamp: new Date().toISOString()
        });
      }
      
      // Marcar login como bem-sucedido - o useEffect vai detectar quando user e profile estiverem prontos
      setLoginSuccess(true);
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
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Entre em contato com o administrador para recuperar sua senha.");
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
                disabled={loading}
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
