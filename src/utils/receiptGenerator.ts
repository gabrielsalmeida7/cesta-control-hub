/**
 * Utilitário para geração de recibos em PDF
 * 
 * Usa jspdf (já instalado) para gerar PDFs de recibos
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { formatDateTimeBrasilia } from "./dateFormat";
import jsPDF from 'jspdf';

type StockMovement = Tables<"stock_movements"> & {
  product: { id: string; name: string; unit: string };
  supplier: { id: string; name: string } | null;
  institution: { id: string; name: string };
};

type Delivery = Tables<"deliveries"> & {
  family: { 
    id: string; 
    name: string; 
    contact_person: string;
    cpf?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null;
  institution: { id: string; name: string } | null;
};

interface ReceiptItem {
  product_name: string;
  quantity: number;
  unit: string;
}

interface ReceiptData {
  type: "STOCK_ENTRY" | "STOCK_EXIT" | "DELIVERY";
  movement?: StockMovement;
  delivery?: Delivery;
  items?: ReceiptItem[]; // Para entregas com múltiplos itens
  institutionName: string;
  date: string;
}

/**
 * Gera PDF de recibo de movimentação de estoque
 */
export const generateStockMovementReceipt = async (
  movement: StockMovement,
  institutionName: string
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Título
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RECIBO DE MOVIMENTAÇÃO DE ESTOQUE", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // Tipo (ENTRADA/SAÍDA)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const movementType = movement.movement_type === "ENTRADA" ? "ENTRADA" : "SAÍDA";
  doc.text(movementType, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 20;

  // Informações gerais
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Instituição: ${institutionName}`, margin, yPosition);
  yPosition += 8;
  
  const formattedDate = formatDateTimeBrasilia(movement.movement_date);
  doc.text(`Data: ${formattedDate}`, margin, yPosition);
  yPosition += 15;

  // Tabela de itens
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Itens:", margin, yPosition);
  yPosition += 8;

  // Cabeçalho da tabela
  const tableStartX = margin;
  const tableWidth = pageWidth - (margin * 2);
  const colWidths = [tableWidth * 0.6, tableWidth * 0.2, tableWidth * 0.2];
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.rect(tableStartX, yPosition, colWidths[0], 8, "S");
  doc.text("Produto", tableStartX + 2, yPosition + 6);
  
  doc.rect(tableStartX + colWidths[0], yPosition, colWidths[1], 8, "S");
  doc.text("Quantidade", tableStartX + colWidths[0] + 2, yPosition + 6);
  
  doc.rect(tableStartX + colWidths[0] + colWidths[1], yPosition, colWidths[2], 8, "S");
  doc.text("Unidade", tableStartX + colWidths[0] + colWidths[1] + 2, yPosition + 6);
  
  yPosition += 8;

  // Linha de item
  doc.setFont("helvetica", "normal");
  doc.rect(tableStartX, yPosition, colWidths[0], 8, "S");
  doc.text(movement.product.name || "Produto", tableStartX + 2, yPosition + 6);
  
  doc.rect(tableStartX + colWidths[0], yPosition, colWidths[1], 8, "S");
  doc.text(movement.quantity.toString(), tableStartX + colWidths[0] + 2, yPosition + 6);
  
  doc.rect(tableStartX + colWidths[0] + colWidths[1], yPosition, colWidths[2], 8, "S");
  doc.text(movement.product.unit || "un", tableStartX + colWidths[0] + colWidths[1] + 2, yPosition + 6);
  
  yPosition += 12;

  // Campos em branco para preenchimento manual
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Linha tracejada para "De onde foi"
  const dashLength = 3;
  const gapLength = 2;
  let xPos = margin + 80;
  while (xPos < pageWidth - margin) {
    doc.line(xPos, yPosition, xPos + dashLength, yPosition);
    xPos += dashLength + gapLength;
  }
  doc.text("De onde foi: ", margin, yPosition - 2);
  yPosition += 12;

  // Linha tracejada para "Para onde vai"
  xPos = margin + 85;
  while (xPos < pageWidth - margin) {
    doc.line(xPos, yPosition, xPos + dashLength, yPosition);
    xPos += dashLength + gapLength;
  }
  doc.text("Para onde vai: ", margin, yPosition - 2);
  yPosition += 15;

  // Observações (se houver)
  if (movement.notes && movement.notes.trim()) {
    doc.setFontSize(10);
    doc.text(`Observações: ${movement.notes}`, margin, yPosition);
    yPosition += 12;
  }

  // Espaço para assinatura
  yPosition = pageHeight - 40;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  doc.setFontSize(9);
  doc.text("Assinatura do Responsável", margin, yPosition);

  const pdfBlob = doc.output("blob");
  return pdfBlob;
};

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
          // Criar canvas para converter SVG em imagem
          // Usar dimensões do viewBox do SVG (1054x410) para melhor qualidade
          const canvas = document.createElement('canvas');
          // Usar dimensões maiores para melhor qualidade no PDF
          const scale = 2; // Aumentar resolução para melhor qualidade
          canvas.width = 1054 * scale;
          canvas.height = 410 * scale;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Desenhar SVG no canvas com escala
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
 * Gera PDF de recibo de entrega para família
 */
export const generateDeliveryReceipt = async (
  delivery: Delivery,
  items: ReceiptItem[],
  institutionName: string,
  transactionId?: string
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
      // Adicionar logo no topo centralizado
      // SVG tem proporção 1054:410 (aproximadamente 2.57:1)
      const logoHeight = 30; // Altura em mm
      const logoWidth = (logoHeight * 1054 / 410); // Proporção correta do SVG
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 5; // Espaço após logo
    } catch (error) {
      console.warn('Erro ao adicionar logo ao PDF:', error);
    }
  }

  // Título
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RECIBO DE ENTREGA", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 20;

  // Informações gerais
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Instituição: ${institutionName}`, margin, yPosition);
  yPosition += 8;
  
  // Usar data/hora salva no banco (momento da entrega)
  const formattedDate = formatDateTimeBrasilia(delivery.delivery_date || new Date().toISOString());
  doc.text(`Data: ${formattedDate}`, margin, yPosition);
  yPosition += 8;

  // ID de Transação (se fornecido)
  if (transactionId) {
    doc.setFont("helvetica", "bold");
    doc.text(`ID de Transação: ${transactionId}`, margin, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 8;
  }
  
  yPosition += 7; // Espaço adicional

  // Dados do beneficiário
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Beneficiário:", margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (delivery.family) {
    doc.text(`Nome: ${delivery.family.name}`, margin, yPosition);
    yPosition += 8;
    
    if (delivery.family.cpf) {
      doc.text(`CPF: ${delivery.family.cpf}`, margin, yPosition);
      yPosition += 8;
    }
    
    doc.text(`Contato: ${delivery.family.contact_person}${delivery.family.phone ? ` - ${delivery.family.phone}` : ''}`, margin, yPosition);
    yPosition += 8;
    
    if (delivery.family.address) {
      doc.text(`Endereço: ${delivery.family.address}`, margin, yPosition);
      yPosition += 8;
    }
  }
  
  yPosition += 5;

  // Tabela de itens entregues
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Itens Entregues:", margin, yPosition);
  yPosition += 8;

  // Cabeçalho da tabela
  const tableStartX = margin;
  const tableWidth = pageWidth - (margin * 2);
  const colWidths = [tableWidth * 0.6, tableWidth * 0.2, tableWidth * 0.2];
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.rect(tableStartX, yPosition, colWidths[0], 8, "S");
  doc.text("Produto", tableStartX + 2, yPosition + 6);
  
  doc.rect(tableStartX + colWidths[0], yPosition, colWidths[1], 8, "S");
  doc.text("Quantidade", tableStartX + colWidths[0] + 2, yPosition + 6);
  
  doc.rect(tableStartX + colWidths[0] + colWidths[1], yPosition, colWidths[2], 8, "S");
  doc.text("Unidade", tableStartX + colWidths[0] + colWidths[1] + 2, yPosition + 6);
  
  yPosition += 8;

  // Linhas de itens
  doc.setFont("helvetica", "normal");
  for (const item of items) {
    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    doc.rect(tableStartX, yPosition, colWidths[0], 8, "S");
    doc.text(item.product_name, tableStartX + 2, yPosition + 6);
    
    doc.rect(tableStartX + colWidths[0], yPosition, colWidths[1], 8, "S");
    doc.text(item.quantity.toString(), tableStartX + colWidths[0] + 2, yPosition + 6);
    
    doc.rect(tableStartX + colWidths[0] + colWidths[1], yPosition, colWidths[2], 8, "S");
    doc.text(item.unit, tableStartX + colWidths[0] + colWidths[1] + 2, yPosition + 6);
    
    yPosition += 8;
  }
  
  yPosition += 8;

  // Observações (se houver)
  if (delivery.notes && delivery.notes.trim()) {
    doc.setFontSize(10);
    doc.text(`Observações: ${delivery.notes}`, margin, yPosition);
    yPosition += 12;
  }

  // Espaço para assinaturas
  yPosition = pageHeight - 50;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  doc.setFontSize(9);
  doc.text("Assinatura do Responsável", margin, yPosition);
  
  yPosition += 20;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  doc.text("Assinatura do Beneficiário", margin, yPosition);

  const pdfBlob = doc.output("blob");
  return pdfBlob;
};

/**
 * Gera PDF de recibo (função genérica mantida para compatibilidade)
 * 
 * @param receiptData - Dados do recibo
 * @returns Blob do PDF gerado
 */
export const generateReceiptPDF = async (
  receiptData: ReceiptData
): Promise<Blob> => {
  if (receiptData.type === "DELIVERY" && receiptData.items && receiptData.items.length > 0) {
    // Usar função específica para entrega com múltiplos itens
    if (!receiptData.delivery) {
      throw new Error("Dados de entrega não fornecidos");
    }
    return generateDeliveryReceipt(receiptData.delivery, receiptData.items, receiptData.institutionName);
  } else if (receiptData.movement) {
    // Usar função específica para movimentação
    return generateStockMovementReceipt(receiptData.movement, receiptData.institutionName);
  } else {
    throw new Error("Dados insuficientes para gerar recibo");
  }
};

/**
 * Faz upload do PDF para Supabase Storage
 * 
 * @param pdfBlob - Blob do PDF
 * @param fileName - Nome do arquivo
 * @returns Objeto com filePath e fileUrl (URL pública se bucket público, ou null se privado)
 */
export const uploadReceiptToStorage = async (
  pdfBlob: Blob,
  fileName: string
): Promise<{ filePath: string; fileUrl: string | null }> => {
  const filePath = `receipts/${fileName}`;

  const { data, error } = await supabase.storage
    .from("receipts")
    .upload(filePath, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw error;

  // Tentar obter URL pública (funciona se o bucket for público)
  // Se o bucket for privado, fileUrl será null e usaremos URLs assinadas
  let fileUrl: string | null = null;
  try {
    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(filePath);
    fileUrl = urlData?.publicUrl || null;
  } catch (e) {
    // Se falhar, bucket provavelmente é privado - usaremos URLs assinadas depois
    fileUrl = null;
  }

  return { filePath, fileUrl };
};

/**
 * Gera URL assinada (temporária) para download do recibo
 * URL expira em 1 hora e requer autenticação
 * Usado apenas quando o bucket é privado
 * 
 * @param filePath - Caminho do arquivo no storage
 * @param expiresIn - Tempo de expiração em segundos (padrão: 3600 = 1 hora)
 * @returns URL assinada temporária
 */
export const getSignedReceiptUrl = async (
  filePath: string,
  expiresIn: number = 3600 // 1 hora em segundos
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Erro ao gerar URL assinada: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error("URL assinada não foi gerada");
  }

  return data.signedUrl;
};

/**
 * Obtém URL para acesso ao recibo (pública ou assinada)
 * Tenta usar URL pública primeiro, se não disponível usa URL assinada
 * 
 * @param filePath - Caminho do arquivo no storage
 * @param fileUrl - URL pública (se disponível)
 * @returns URL para acesso ao arquivo
 */
export const getReceiptUrl = async (
  filePath: string,
  fileUrl: string | null
): Promise<string> => {
  // Se temos URL pública (bucket público), usar ela
  if (fileUrl) {
    return fileUrl;
  }
  
  // Caso contrário, gerar URL assinada (bucket privado)
  return await getSignedReceiptUrl(filePath);
};

/**
 * Gera recibo completo (PDF + upload + salva referência)
 * 
 * @param receiptData - Dados do recibo
 * @param referenceId - ID de referência (movement_id ou delivery_id)
 * @returns Dados do recibo salvo (filePath e URL)
 */
export const generateAndSaveReceipt = async (
  receiptData: ReceiptData,
  referenceId: string
): Promise<{ filePath: string; fileUrl: string }> => {
  // Gerar PDF
  const pdfBlob = await generateReceiptPDF(receiptData);

  // Nome do arquivo
  const timestamp = Date.now();
  const fileName = `recibo-${receiptData.type.toLowerCase()}-${timestamp}.pdf`;

  // Upload para storage
  const { filePath, fileUrl } = await uploadReceiptToStorage(pdfBlob, fileName);

  // Obter URL (pública ou assinada)
  const finalUrl = await getReceiptUrl(filePath, fileUrl);

  return {
    filePath,
    fileUrl: finalUrl,
  };
};
