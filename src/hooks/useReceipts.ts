import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type {
  Tables,
  TablesInsert
} from "@/integrations/supabase/types";
import { 
  generateStockMovementReceipt, 
  generateDeliveryReceipt,
  uploadReceiptToStorage 
} from "@/utils/receiptGenerator";

type Receipt = Tables<"receipts">;
type ReceiptInsert = TablesInsert<"receipts">;

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

export const useReceipts = (institutionId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["receipts", institutionId || profile?.institution_id],
    queryFn: async () => {
      let query = supabase
        .from("receipts")
        .select("*")
        .order("generated_at", { ascending: false });

      // Se for instituição, filtrar apenas seus recibos
      if (profile?.role === "institution" && !institutionId) {
        query = query.eq("institution_id", profile.institution_id!);
      } else if (institutionId) {
        query = query.eq("institution_id", institutionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Receipt[];
    },
    enabled: !!profile,
  });
};

export const useGenerateReceipt = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      receiptType,
      referenceId,
      filePath,
      fileUrl,
    }: {
      receiptType: "STOCK_ENTRY" | "STOCK_EXIT" | "DELIVERY";
      referenceId: string;
      filePath: string;
      fileUrl: string;
    }) => {
      if (!profile?.institution_id) {
        throw new Error("Instituição não encontrada");
      }

      const receipt: ReceiptInsert = {
        receipt_type: receiptType,
        institution_id: profile.institution_id,
        reference_id: referenceId,
        file_path: filePath,
        file_url: fileUrl,
        generated_by_user_id: user?.id || null,
      };

      const { data, error } = await supabase
        .from("receipts")
        .insert(receipt)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      toast({
        title: "Sucesso",
        description: "Recibo gerado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao gerar recibo: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDownloadReceipt = () => {
  const { toast } = useToast();

  return {
    download: async (fileUrl: string) => {
      try {
        // Criar link temporário para download
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `recibo-${Date.now()}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Erro ao baixar recibo: " + error.message,
          variant: "destructive",
        });
      }
    },
  };
};

/**
 * Busca dados completos de uma movimentação para gerar recibo
 */
const fetchMovementForReceipt = async (movementId: string): Promise<StockMovement> => {
  const { data, error } = await supabase
    .from("stock_movements")
    .select(`
      *,
      product:products!stock_movements_product_id_fkey(id, name, unit),
      supplier:suppliers(id, name),
      institution:institutions!stock_movements_institution_id_fkey(id, name)
    `)
    .eq("id", movementId)
    .single();

  if (error) throw error;
  return data as StockMovement;
};

/**
 * Busca dados completos de uma entrega para gerar recibo
 */
const fetchDeliveryForReceipt = async (deliveryId: string): Promise<{
  delivery: Delivery;
  items: ReceiptItem[];
}> => {
  // Buscar entrega com família e instituição
  const { data: deliveryData, error: deliveryError } = await supabase
    .from("deliveries")
    .select(`
      *,
      family:families(id, name, contact_person, cpf, address, phone),
      institution:institutions!deliveries_institution_id_fkey(id, name)
    `)
    .eq("id", deliveryId)
    .single();

  if (deliveryError) throw deliveryError;

  // Buscar todas as movimentações relacionadas a esta entrega
  const { data: movements, error: movementsError } = await supabase
    .from("stock_movements")
    .select(`
      *,
      product:products!stock_movements_product_id_fkey(id, name, unit)
    `)
    .eq("delivery_id", deliveryId);

  if (movementsError) throw movementsError;

  // Converter movimentações para formato de itens do recibo
  const items: ReceiptItem[] = (movements || []).map((movement: any) => ({
    product_name: movement.product?.name || "Produto",
    quantity: Number(movement.quantity),
    unit: movement.product?.unit || "un",
  }));

  return {
    delivery: deliveryData as Delivery,
    items,
  };
};

/**
 * Hook para gerar recibo de movimentação individual
 */
export const useGenerateMovementReceipt = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const generateReceipt = useGenerateReceipt();

  return useMutation({
    mutationFn: async (movementId: string) => {
      if (!profile?.institution_id) {
        throw new Error("Instituição não encontrada");
      }

      // Buscar dados completos da movimentação
      const movement = await fetchMovementForReceipt(movementId);

      if (!movement.institution) {
        throw new Error("Instituição não encontrada na movimentação");
      }

      // Gerar PDF
      const pdfBlob = await generateStockMovementReceipt(
        movement,
        movement.institution.name
      );

      // Nome do arquivo
      const timestamp = Date.now();
      const fileName = `recibo-${movement.movement_type.toLowerCase()}-${timestamp}.pdf`;

      // Upload para storage
      const fileUrl = await uploadReceiptToStorage(pdfBlob, fileName);

      // Salvar referência na tabela receipts
      const receiptType = movement.movement_type === "ENTRADA" ? "STOCK_ENTRY" : "STOCK_EXIT";
      await generateReceipt.mutateAsync({
        receiptType,
        referenceId: movementId,
        filePath: `receipts/${fileName}`,
        fileUrl,
      });

      return { fileUrl, fileName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast({
        title: "Sucesso",
        description: "Recibo gerado com sucesso!",
      });
      // Abrir PDF em nova aba
      window.open(data.fileUrl, "_blank");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao gerar recibo: " + error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook para gerar recibo de entrega
 */
export const useGenerateDeliveryReceipt = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const generateReceipt = useGenerateReceipt();

  return useMutation({
    mutationFn: async (deliveryId: string) => {
      if (!profile?.institution_id) {
        throw new Error("Instituição não encontrada");
      }

      // Buscar dados completos da entrega
      const { delivery, items } = await fetchDeliveryForReceipt(deliveryId);

      if (!delivery.institution) {
        throw new Error("Instituição não encontrada na entrega");
      }

      if (items.length === 0) {
        throw new Error("Nenhum item encontrado para esta entrega");
      }

      // Gerar PDF
      const pdfBlob = await generateDeliveryReceipt(
        delivery,
        items,
        delivery.institution.name
      );

      // Nome do arquivo
      const timestamp = Date.now();
      const fileName = `recibo-entrega-${timestamp}.pdf`;

      // Upload para storage
      const fileUrl = await uploadReceiptToStorage(pdfBlob, fileName);

      // Salvar referência na tabela receipts
      const receipt = await generateReceipt.mutateAsync({
        receiptType: "DELIVERY",
        referenceId: deliveryId,
        filePath: `receipts/${fileName}`,
        fileUrl,
      });

      // Atualizar campo receipt_id na tabela deliveries
      const { error: updateError } = await supabase
        .from("deliveries")
        .update({ receipt_id: receipt.id })
        .eq("id", deliveryId);

      if (updateError) {
        console.error("Erro ao atualizar receipt_id na entrega:", updateError);
        // Não falhar a operação se apenas a atualização falhar
      }

      return { fileUrl, fileName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["institution-deliveries"] });
      toast({
        title: "Sucesso",
        description: "Recibo de entrega gerado com sucesso!",
      });
      // Abrir PDF em nova aba
      window.open(data.fileUrl, "_blank");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao gerar recibo: " + error.message,
        variant: "destructive",
      });
    },
  });
};

