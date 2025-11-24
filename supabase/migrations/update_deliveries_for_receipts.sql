-- Migration: Adicionar campo receipt_id na tabela deliveries
-- Data: 2025-01-XX
-- Descrição: Adiciona referência ao recibo gerado para a entrega

ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL;

-- Índice para busca
CREATE INDEX IF NOT EXISTS idx_deliveries_receipt_id 
ON public.deliveries(receipt_id) 
WHERE receipt_id IS NOT NULL;

-- Comentário
COMMENT ON COLUMN public.deliveries.receipt_id IS 'Referência ao recibo gerado para esta entrega (opcional)';

