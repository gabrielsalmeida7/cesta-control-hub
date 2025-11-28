/**
 * Utilitário para geração de Termo de Consentimento LGPD em PDF
 * 
 * Gera documento imprimível com dados personalizados da família
 * para coleta de consentimento conforme Art. 8º da LGPD
 */

import jsPDF from 'jspdf';
import { formatCpf } from './documentFormat';

export interface ConsentTermData {
  familyName: string;
  familyCpf?: string;
  contactPerson: string;
  phone?: string;
  address?: string;
  institutionName: string;
  termId: string;
  generatedAt: string;
}

/**
 * Carrega a logo SVG e converte para base64 para usar no PDF
 */
const loadLogoAsBase64 = async (): Promise<string | null> => {
  try {
    const response = await fetch('/CestaJustaLogo.svg');
    if (!response.ok) return null;
    
    const svgText = await response.text();
    
    // Converter SVG para imagem usando canvas
    return new Promise((resolve) => {
      const img = new Image();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = 1054 * scale;
          canvas.height = 410 * scale;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(base64);
          } else {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        } catch (error) {
          console.warn('Erro ao converter SVG para canvas:', error);
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      
      img.src = url;
    });
  } catch (error) {
    console.warn('Erro ao carregar logo SVG:', error);
    return null;
  }
};

/**
 * Adiciona texto com quebra automática de linha
 */
const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = 5
): number => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
};

/**
 * Gera PDF do Termo de Consentimento LGPD
 */
export const generateConsentTermPDF = async (
  data: ConsentTermData
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Carregar e adicionar logo
  const logoBase64 = await loadLogoAsBase64();
  if (logoBase64) {
    try {
      const logoHeight = 25;
      const logoWidth = (logoHeight * 1054 / 410);
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 8;
    } catch (error) {
      console.warn('Erro ao adicionar logo ao PDF:', error);
    }
  }

  // Título
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TERMO DE CONSENTIMENTO PARA", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 6;
  doc.text("TRATAMENTO DE DADOS PESSOAIS", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;
  doc.setFontSize(10);
  doc.text("(Lei nº 13.709/2018 - LGPD)", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // ID do Termo
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`ID do Termo: ${data.termId}`, pageWidth - margin, yPosition, { align: "right" });
  doc.text(`Gerado em: ${data.generatedAt}`, pageWidth - margin, yPosition + 4, { align: "right" });
  yPosition += 12;

  // Dados do Titular
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("IDENTIFICAÇÃO DO TITULAR", margin, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "normal");
  doc.text(`Nome da Família: ${data.familyName}`, margin, yPosition);
  yPosition += 5;
  
  if (data.familyCpf) {
    doc.text(`CPF: ${formatCpf(data.familyCpf)}`, margin, yPosition);
    yPosition += 5;
  }
  
  doc.text(`Pessoa de Contato: ${data.contactPerson}`, margin, yPosition);
  yPosition += 5;
  
  if (data.phone) {
    doc.text(`Telefone: ${data.phone}`, margin, yPosition);
    yPosition += 5;
  }
  
  if (data.address) {
    yPosition = addWrappedText(doc, `Endereço: ${data.address}`, margin, yPosition, pageWidth - (margin * 2));
    yPosition += 3;
  }
  
  doc.text(`Instituição: ${data.institutionName}`, margin, yPosition);
  yPosition += 10;

  // Declaração de Consentimento
  doc.setFont("helvetica", "bold");
  doc.text("DECLARAÇÃO DE CONSENTIMENTO", margin, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "normal");
  const declaration = `Eu, ${data.contactPerson}, na qualidade de representante da família ${data.familyName}, declaro estar CIENTE e CONCORDO que meus dados pessoais sejam coletados e tratados nos termos desta declaração e em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD).`;
  yPosition = addWrappedText(doc, declaration, margin, yPosition, pageWidth - (margin * 2), 5);
  yPosition += 8;

  // 1. Finalidades
  doc.setFont("helvetica", "bold");
  doc.text("1. FINALIDADES DO TRATAMENTO DE DADOS", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  const finalidades = [
    "• Cadastro no programa de distribuição de cestas básicas",
    "• Controle de entregas e gestão de bloqueios temporários",
    "• Prevenção de duplicidade de benefícios",
    "• Geração de relatórios estatísticos e análises de impacto",
    "• Geração de recibos de entrega",
    "• Cumprimento de obrigações legais e políticas públicas"
  ];
  
  finalidades.forEach(item => {
    yPosition = addWrappedText(doc, item, margin, yPosition, pageWidth - (margin * 2), 5);
    yPosition += 2;
  });
  yPosition += 5;

  // 2. Dados Coletados
  doc.setFont("helvetica", "bold");
  doc.text("2. DADOS PESSOAIS COLETADOS", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  const dadosColetados = "Nome completo, CPF, endereço, telefone, pessoa de contato, número de membros da família e histórico de entregas recebidas.";
  yPosition = addWrappedText(doc, dadosColetados, margin, yPosition, pageWidth - (margin * 2));
  yPosition += 8;

  // 3. Bases Legais
  doc.setFont("helvetica", "bold");
  doc.text("3. BASES LEGAIS (Art. 7º da LGPD)", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  const basesLegais = "Este tratamento é fundamentado no CONSENTIMENTO do titular (Art. 7º, I), na EXECUÇÃO DE POLÍTICA PÚBLICA (Art. 7º, III), na PROTEÇÃO DA VIDA (Art. 7º, VII) e na TUTELA DA SAÚDE (Art. 7º, VIII).";
  yPosition = addWrappedText(doc, basesLegais, margin, yPosition, pageWidth - (margin * 2));
  yPosition += 8;

  // Nova página se necessário
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  }

  // 4. Compartilhamento
  doc.setFont("helvetica", "bold");
  doc.text("4. COMPARTILHAMENTO DE DADOS", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  const compartilhamento = "Os dados poderão ser compartilhados com: (a) instituições parceiras do programa; (b) autoridades públicas quando exigido por lei; (c) órgãos de controle para fiscalização. NÃO comercializamos ou compartilhamos seus dados para fins comerciais.";
  yPosition = addWrappedText(doc, compartilhamento, margin, yPosition, pageWidth - (margin * 2));
  yPosition += 8;

  // 5. Direitos do Titular
  doc.setFont("helvetica", "bold");
  doc.text("5. SEUS DIREITOS (Art. 18 da LGPD)", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const direitos = [
    "• Confirmação da existência de tratamento",
    "• Acesso aos dados pessoais",
    "• Correção de dados incompletos, inexatos ou desatualizados",
    "• Anonimização, bloqueio ou eliminação de dados desnecessários",
    "• Portabilidade dos dados",
    "• Eliminação dos dados tratados com consentimento",
    "• Informação sobre compartilhamento",
    "• Revogação do consentimento"
  ];
  
  direitos.forEach(item => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }
    yPosition = addWrappedText(doc, item, margin, yPosition, pageWidth - (margin * 2), 4);
    yPosition += 2;
  });
  yPosition += 6;

  // 6. Contato DPO
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("6. ENCARREGADO DE PROTEÇÃO DE DADOS (DPO)", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.text("Para exercer seus direitos, entre em contato:", margin, yPosition);
  yPosition += 5;
  doc.text("Email: dpo@cestacontrolhub.com.br", margin + 5, yPosition);
  yPosition += 4;
  doc.text("Telefone: (34) 99999-0000", margin + 5, yPosition);
  yPosition += 4;
  doc.text("Prazo de resposta: até 15 dias úteis", margin + 5, yPosition);
  yPosition += 8;

  // 7. Retenção
  doc.setFont("helvetica", "bold");
  doc.text("7. RETENÇÃO DE DADOS", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  const retencao = "Seus dados serão mantidos enquanto houver vínculo ativo com o programa e por até 5 anos após a última entrega, para fins de prestação de contas. Após esse período, serão eliminados ou anonimizados.";
  yPosition = addWrappedText(doc, retencao, margin, yPosition, pageWidth - (margin * 2));
  yPosition += 8;

  // 8. Revogação
  doc.setFont("helvetica", "bold");
  doc.text("8. REVOGAÇÃO DO CONSENTIMENTO", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  const revogacao = "Você pode REVOGAR este consentimento a qualquer momento, entrando em contato com o DPO. A revogação não afetará o tratamento realizado anteriormente com base no consentimento.";
  yPosition = addWrappedText(doc, revogacao, margin, yPosition, pageWidth - (margin * 2));
  yPosition += 10;

  // Nova página para assinaturas se necessário
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }

  // Declaração Final
  doc.setFont("helvetica", "bold");
  yPosition = addWrappedText(
    doc,
    "DECLARO que li, compreendi e concordo com os termos acima descritos, consentindo livre e expressamente com o tratamento de meus dados pessoais.",
    margin,
    yPosition,
    pageWidth - (margin * 2),
    5
  );
  yPosition += 15;

  // Espaços para assinatura
  const col1X = margin;
  const col2X = pageWidth / 2 + 5;
  
  // Linha para assinatura do titular
  doc.setFont("helvetica", "normal");
  doc.line(col1X, yPosition, col1X + 70, yPosition);
  yPosition += 5;
  doc.setFontSize(9);
  doc.text("Assinatura do Titular", col1X, yPosition);
  doc.text(data.contactPerson, col1X, yPosition + 4);
  if (data.familyCpf) {
    doc.text(`CPF: ${formatCpf(data.familyCpf)}`, col1X, yPosition + 8);
  }

  // Linha para assinatura do responsável da instituição
  yPosition -= 5; // Voltar para alinhar com a primeira coluna
  doc.setFontSize(10);
  doc.line(col2X, yPosition, col2X + 70, yPosition);
  yPosition += 5;
  doc.setFontSize(9);
  doc.text("Responsável pela Instituição", col2X, yPosition);
  doc.text(data.institutionName, col2X, yPosition + 4);
  yPosition += 8;

  // Data
  yPosition += 10;
  doc.setFontSize(9);
  doc.text(`Data: _____/_____/__________`, margin, yPosition);
  
  // Rodapé
  yPosition = pageHeight - 15;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Este documento foi gerado eletronicamente e pode ser impresso em 2 vias: 1 via para o titular e 1 via para arquivo da instituição.",
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );
  doc.text(
    `ID do Termo: ${data.termId} | Gerado em: ${data.generatedAt}`,
    pageWidth / 2,
    yPosition + 3,
    { align: "center" }
  );

  const pdfBlob = doc.output("blob");
  return pdfBlob;
};

/**
 * Gera ID único para o termo de consentimento
 */
export const generateTermId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TERMO-${timestamp}-${random}`;
};

