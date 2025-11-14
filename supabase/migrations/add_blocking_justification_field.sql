-- ============================================
-- Adicionar campo blocking_justification na tabela deliveries
-- ============================================

-- Adicionar coluna para armazenar justificativa quando entrega é feita para família bloqueada
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS blocking_justification TEXT;

-- Comentário
COMMENT ON COLUMN public.deliveries.blocking_justification IS 'Justificativa obrigatória quando uma entrega é realizada para uma família bloqueada por outra instituição. Indica possível fraude.';

