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
 * Gera PDF de recibo de entrega para família
 */
export const generateDeliveryReceipt = async (
  delivery: Delivery,
  items: ReceiptItem[],
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
  doc.text("RECIBO DE ENTREGA", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 20;

  // Informações gerais
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Instituição: ${institutionName}`, margin, yPosition);
  yPosition += 8;
  
  const formattedDate = formatDateTimeBrasilia(delivery.delivery_date || new Date().toISOString());
  doc.text(`Data: ${formattedDate}`, margin, yPosition);
  yPosition += 15;

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
 * @returns URL pública do arquivo
 */
export const uploadReceiptToStorage = async (
  pdfBlob: Blob,
  fileName: string
): Promise<string> => {
  const filePath = `receipts/${fileName}`;

  const { data, error } = await supabase.storage
    .from("receipts")
    .upload(filePath, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw error;

  // Obter URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(filePath);

  return publicUrl;
};

/**
 * Gera recibo completo (PDF + upload + salva referência)
 * 
 * @param receiptData - Dados do recibo
 * @param referenceId - ID de referência (movement_id ou delivery_id)
 * @returns Dados do recibo salvo
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
  const fileUrl = await uploadReceiptToStorage(pdfBlob, fileName);

  return {
    filePath: `receipts/${fileName}`,
    fileUrl,
  };
};
