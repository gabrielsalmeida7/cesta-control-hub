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
  generateDeliveryReceipt
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
      filePath = null,
      fileUrl = null,
    }: {
      receiptType: "STOCK_ENTRY" | "STOCK_EXIT" | "DELIVERY";
      referenceId: string;
      filePath?: string | null; // Opcional - não salva mais arquivos no storage
      fileUrl?: string | null; // Opcional - não salva mais URLs
    }) => {
      if (!profile?.institution_id) {
        throw new Error("Instituição não encontrada");
      }

      const receipt: ReceiptInsert = {
        receipt_type: receiptType,
        institution_id: profile.institution_id,
        reference_id: referenceId,
        file_path: filePath || null, // Null - não salva mais arquivos
        file_url: fileUrl || null, // Null - não salva mais URLs
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
    download: async (receiptId: string, receiptType: "STOCK_ENTRY" | "STOCK_EXIT" | "DELIVERY", referenceId: string) => {
      try {
        // Como não salvamos mais PDFs, precisamos gerar novamente
        // Isso requer buscar os dados e gerar o PDF novamente
        toast({
          title: "Aviso",
          description: "Recibos não são mais armazenados. Use o botão 'Gerar Recibo' para criar um novo PDF.",
          variant: "default",
        });
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Erro ao processar solicitação: " + error.message,
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
 * Gera ID de transação no formato 001/2025 baseado em entregas do ano
 * @param deliveryId - ID da entrega atual
 * @param deliveryDate - Data da entrega
 * @returns ID de transação no formato "001/2025"
 */
const generateReceiptTransactionId = async (
  deliveryId: string,
  deliveryDate: string
): Promise<string> => {
  try {
    // Obter ano atual da data da entrega
    const deliveryYear = new Date(deliveryDate).getFullYear();
    const yearStart = new Date(deliveryYear, 0, 1).toISOString();
    const yearEnd = new Date(deliveryYear, 11, 31, 23, 59, 59).toISOString();

    // Buscar todas as entregas do ano atual, ordenadas por data e depois por id
    const { data: deliveries, error } = await supabase
      .from("deliveries")
      .select("id, delivery_date, created_at")
      .gte("delivery_date", yearStart)
      .lte("delivery_date", yearEnd)
      .order("delivery_date", { ascending: true });

    if (error) {
      console.warn("Erro ao buscar entregas para gerar ID de transação:", error);
      // Fallback: usar apenas o ano
      return `001/${deliveryYear}`;
    }

    if (!deliveries || deliveries.length === 0) {
      return `001/${deliveryYear}`;
    }

    // Ordenar localmente: primeiro por data, depois por created_at, depois por id
    const sortedDeliveries = [...deliveries].sort((a, b) => {
      const dateA = new Date(a.delivery_date || 0).getTime();
      const dateB = new Date(b.delivery_date || 0).getTime();
      
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      // Se mesma data, ordenar por created_at
      const createdA = new Date(a.created_at || 0).getTime();
      const createdB = new Date(b.created_at || 0).getTime();
      if (createdA !== createdB) {
        return createdA - createdB;
      }
      
      // Se mesmo created_at, ordenar por id
      return a.id.localeCompare(b.id);
    });

    // Encontrar posição desta entrega na lista ordenada
    const currentDeliveryIndex = sortedDeliveries.findIndex((d) => d.id === deliveryId);

    if (currentDeliveryIndex === -1) {
      // Se não encontrou, contar todas as entregas antes desta data/hora
      const deliveryDateTime = new Date(deliveryDate).getTime();
      const deliveriesBefore = sortedDeliveries.filter((d) => {
        const dDateTime = new Date(d.delivery_date || 0).getTime();
        if (dDateTime < deliveryDateTime) return true;
        if (dDateTime === deliveryDateTime && d.id !== deliveryId) {
          // Mesma data, verificar created_at
          const dCreated = new Date(d.created_at || 0).getTime();
          const currentCreated = new Date().getTime(); // Aproximação
          if (dCreated < currentCreated) return true;
          if (dCreated === currentCreated && d.id < deliveryId) return true;
        }
        return false;
      });
      const sequenceNumber = deliveriesBefore.length + 1;
      return `${String(sequenceNumber).padStart(3, "0")}/${deliveryYear}`;
    }

    // Sequência baseada na posição (1-indexed)
    const sequenceNumber = currentDeliveryIndex + 1;
    return `${String(sequenceNumber).padStart(3, "0")}/${deliveryYear}`;
  } catch (error) {
    console.warn("Erro ao gerar ID de transação:", error);
    // Fallback: usar ano atual
    const currentYear = new Date().getFullYear();
    return `001/${currentYear}`;
  }
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
 * Gera PDF e abre diretamente no navegador, sem salvar no storage
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

      // Criar URL temporária do Blob para abrir no navegador
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Salvar referência na tabela receipts (sem file_path e file_url)
      const receiptType = movement.movement_type === "ENTRADA" ? "STOCK_ENTRY" : "STOCK_EXIT";
      try {
        await generateReceipt.mutateAsync({
          receiptType,
          referenceId: movementId,
          filePath: null, // Não salva mais arquivo
          fileUrl: null, // Não salva mais URL
        });
      } catch (error) {
        // Não falhar se não conseguir salvar referência - o importante é gerar o PDF
        console.warn("Não foi possível salvar referência do recibo:", error);
      }

      return { pdfUrl, pdfBlob };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast({
        title: "Sucesso",
        description: "Recibo gerado com sucesso!",
      });
      // Abrir PDF em nova aba
      window.open(data.pdfUrl, "_blank");
      
      // Limpar URL temporária após um tempo (para liberar memória)
      setTimeout(() => {
        URL.revokeObjectURL(data.pdfUrl);
      }, 1000);
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
 * Gera PDF e abre diretamente no navegador, sem salvar no storage
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

      // Gerar ID de transação (001/2025)
      const transactionId = await generateReceiptTransactionId(
        deliveryId,
        delivery.delivery_date || new Date().toISOString()
      );

      // Gerar PDF
      const pdfBlob = await generateDeliveryReceipt(
        delivery,
        items,
        delivery.institution.name,
        transactionId
      );

      // Criar URL temporária do Blob para abrir no navegador
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Salvar referência na tabela receipts (sem file_path e file_url)
      let receipt = null;
      try {
        receipt = await generateReceipt.mutateAsync({
          receiptType: "DELIVERY",
          referenceId: deliveryId,
          filePath: null, // Não salva mais arquivo
          fileUrl: null, // Não salva mais URL
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
      } catch (error) {
        // Não falhar se não conseguir salvar referência - o importante é gerar o PDF
        console.warn("Não foi possível salvar referência do recibo:", error);
      }

      return { pdfUrl, pdfBlob, receipt };
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
      window.open(data.pdfUrl, "_blank");
      
      // Limpar URL temporária após um tempo (para liberar memória)
      setTimeout(() => {
        URL.revokeObjectURL(data.pdfUrl);
      }, 1000);
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

