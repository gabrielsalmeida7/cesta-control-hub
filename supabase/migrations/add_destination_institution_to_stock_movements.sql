-- Migration: Adicionar campo destination_institution_id em stock_movements
-- Data: 2025-01-XX
-- Descrição: Permite registrar transferências de estoque entre instituições

-- Adicionar coluna destination_institution_id
ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS destination_institution_id UUID;

-- Adicionar constraint de foreign key com nome explícito
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stock_movements_destination_institution_id_fkey'
  ) THEN
    ALTER TABLE public.stock_movements
    ADD CONSTRAINT stock_movements_destination_institution_id_fkey
    FOREIGN KEY (destination_institution_id) 
    REFERENCES public.institutions(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_destination_institution_id 
ON public.stock_movements(destination_institution_id) 
WHERE destination_institution_id IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN public.stock_movements.destination_institution_id IS 
'Instituição destino para transferências entre instituições. Usado apenas para movimentações de SAIDA. Quando preenchido, indica que o item foi transferido para outra instituição.';

