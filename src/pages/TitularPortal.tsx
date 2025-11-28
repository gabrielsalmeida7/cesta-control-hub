/**
 * Portal do Titular - LGPD
 * 
 * Permite que titulares de dados exerçam seus direitos conforme Art. 18 da LGPD
 */

import { useState } from "react";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  Trash2, 
  Edit, 
  ShieldCheck, 
  Mail,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

const TitularPortal = () => {
  const [cpf, setCpf] = useState("");
  const [requestType, setRequestType] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCpf = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleSubmit = async () => {
    if (!cpf || !requestType) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu CPF e selecione o tipo de solicitação.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simular envio (em produção, enviar para backend/email)
    setTimeout(() => {
      toast({
        title: "Solicitação Enviada",
        description: `Sua solicitação foi recebida e será processada em até 15 dias úteis. Você receberá um retorno em seu email cadastrado.`,
      });
      
      // Limpar formulário
      setCpf("");
      setRequestType("");
      setMessage("");
      setIsSubmitting(false);
    }, 1500);
  };

  const rights = [
    {
      id: "access",
      icon: <FileText className="h-5 w-5" />,
      title: "Acesso aos Dados",
      description: "Solicitar cópia de todos os seus dados pessoais que possuímos",
      detail: "Você receberá um arquivo com todas as informações cadastradas em nosso sistema"
    },
    {
      id: "correction",
      icon: <Edit className="h-5 w-5" />,
      title: "Correção de Dados",
      description: "Corrigir informações incompletas, inexatas ou desatualizadas",
      detail: "Informe quais dados estão incorretos e as correções desejadas"
    },
    {
      id: "portability",
      icon: <Download className="h-5 w-5" />,
      title: "Portabilidade",
      description: "Obter seus dados em formato estruturado (JSON/CSV)",
      detail: "Útil para transferir seus dados para outro serviço"
    },
    {
      id: "deletion",
      icon: <Trash2 className="h-5 w-5" />,
      title: "Eliminação de Dados",
      description: "Solicitar a exclusão completa de seus dados pessoais",
      detail: "Seus dados serão excluídos permanentemente, salvo obrigações legais"
    },
    {
      id: "revoke",
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Revogar Consentimento",
      description: "Retirar seu consentimento para tratamento de dados",
      detail: "Você pode revogar seu consentimento a qualquer momento"
    },
    {
      id: "info",
      icon: <AlertCircle className="h-5 w-5" />,
      title: "Informações sobre Tratamento",
      description: "Saber com quem compartilhamos seus dados e para quais finalidades",
      detail: "Transparência sobre o uso de suas informações"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Portal do Titular de Dados</h1>
            <p className="text-gray-600">
              Exerça seus direitos garantidos pela LGPD (Lei nº 13.709/2018)
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="mb-8 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Importante:</strong> Todas as solicitações serão analisadas e respondidas em até 15 dias úteis. 
              Você receberá confirmação por email.
            </AlertDescription>
          </Alert>

          {/* Rights Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {rights.map((right) => (
              <Card 
                key={right.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  requestType === right.id ? 'border-blue-500 border-2' : ''
                }`}
                onClick={() => setRequestType(right.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {right.icon}
                    {right.title}
                  </CardTitle>
                  <CardDescription>{right.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{right.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Formulário de Solicitação
              </CardTitle>
              <CardDescription>
                Preencha os dados abaixo para enviar sua solicitação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cpf">CPF do Titular *</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  maxLength={14}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usaremos seu CPF para localizar seus dados em nosso sistema
                </p>
              </div>

              <div>
                <Label htmlFor="request-type">Tipo de Solicitação *</Label>
                <select
                  id="request-type"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="">Selecione...</option>
                  {rights.map((right) => (
                    <option key={right.id} value={right.id}>
                      {right.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="message">Mensagem / Detalhes (opcional)</Label>
                <Textarea
                  id="message"
                  placeholder="Descreva sua solicitação com mais detalhes, se necessário..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Proteção de Dados:</strong> Suas informações serão utilizadas exclusivamente para 
                  processar sua solicitação e entrar em contato com você. Não compartilhamos seus dados 
                  com terceiros sem autorização.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCpf("");
                    setRequestType("");
                    setMessage("");
                  }}
                >
                  Limpar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !cpf || !requestType}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Contato do DPO</CardTitle>
              <CardDescription>
                Encarregado de Proteção de Dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Email:</strong> dpo@cestacontrolhub.com.br</p>
              <p><strong>Telefone:</strong> (34) 99999-0000</p>
              <p><strong>Horário:</strong> Segunda a Sexta, 9h às 18h</p>
              <p className="text-sm text-gray-500 pt-2">
                Prazo de resposta: até 15 dias úteis
              </p>
            </CardContent>
          </Card>

          {/* Legal Info */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Este portal está em conformidade com a Lei nº 13.709/2018 (LGPD) - Art. 18
            </p>
            <p className="mt-2">
              Para mais informações, consulte nossa{" "}
              <a href="/politica-privacidade" className="text-blue-600 underline">
                Política de Privacidade
              </a>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TitularPortal;

