-- Migration: Criar tabela receipts (Recibos Gerados)
-- Data: 2025-01-XX
-- Descrição: Tabela para armazenar referências aos recibos em PDF gerados

CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_type TEXT NOT NULL CHECK (receipt_type IN ('STOCK_ENTRY', 'STOCK_EXIT', 'DELIVERY')),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    reference_id UUID NOT NULL, -- Pode ser stock_movement_id ou delivery_id
    file_path TEXT, -- Caminho do arquivo no storage
    file_url TEXT, -- URL pública do PDF
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_receipts_institution_id 
ON public.receipts(institution_id);

CREATE INDEX IF NOT EXISTS idx_receipts_receipt_type 
ON public.receipts(receipt_type);

CREATE INDEX IF NOT EXISTS idx_receipts_reference_id 
ON public.receipts(reference_id);

CREATE INDEX IF NOT EXISTS idx_receipts_generated_at 
ON public.receipts(generated_at);

-- Comentários nas colunas
COMMENT ON TABLE public.receipts IS 'Tabela de recibos em PDF gerados para movimentações e entregas';
COMMENT ON COLUMN public.receipts.receipt_type IS 'Tipo de recibo: STOCK_ENTRY (entrada), STOCK_EXIT (saída), DELIVERY (entrega)';
COMMENT ON COLUMN public.receipts.reference_id IS 'ID de referência (stock_movement_id para entradas/saídas, delivery_id para entregas)';
COMMENT ON COLUMN public.receipts.file_path IS 'Caminho do arquivo PDF no Supabase Storage';
COMMENT ON COLUMN public.receipts.file_url IS 'URL pública do PDF para download';
COMMENT ON COLUMN public.receipts.generated_at IS 'Data e hora de geração do recibo';
COMMENT ON COLUMN public.receipts.generated_by_user_id IS 'Usuário que gerou o recibo';

