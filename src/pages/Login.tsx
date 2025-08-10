import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const action = isSignup ? signUp : signIn;
    const { error } = await action(email, password);
    
    // For signup, the hook will show a toast to verify email
    if (!error && !isSignup) {
      // Let the auth state change handle the redirect
    }
    
    setLoading(false);
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
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={loading}
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

            {/* Seção de Bypass para Testes */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-4">
                🧪 Acesso de Teste (Bypass)
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={handleBypassAdmin}
                  variant="outline" 
                  className="w-full text-sm"
                >
                  🔧 Entrar como Administrador
                </Button>
                <Button 
                  onClick={handleBypassInstitution}
                  variant="outline" 
                  className="w-full text-sm"
                >
                  🏢 Entrar como Instituição
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Para testes e desenvolvimento
              </p>
            </div>
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
