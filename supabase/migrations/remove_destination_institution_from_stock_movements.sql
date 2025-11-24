-- Migration: Remover campo destination_institution_id de stock_movements
-- Data: 2025-01-XX
-- Descrição: Simplifica o sistema removendo transferências automáticas entre instituições

-- Remover índice primeiro (se existir)
DROP INDEX IF EXISTS public.idx_stock_movements_destination_institution_id;

-- Remover constraint de foreign key (se existir) - múltiplas tentativas para garantir
DO $$
BEGIN
  -- Tentar remover com nome explícito
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stock_movements_destination_institution_id_fkey'
  ) THEN
    ALTER TABLE public.stock_movements
    DROP CONSTRAINT stock_movements_destination_institution_id_fkey;
  END IF;
  
  -- Tentar remover qualquer constraint relacionada a destination_institution_id
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.stock_movements'::regclass
    AND confrelid = 'public.institutions'::regclass
    AND conname LIKE '%destination%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- Remover coluna destination_institution_id (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_movements' 
    AND column_name = 'destination_institution_id'
  ) THEN
    ALTER TABLE public.stock_movements
    DROP COLUMN destination_institution_id;
  END IF;
END $$;

-- Comentário de documentação
COMMENT ON TABLE public.stock_movements IS 
'Movimentações de estoque simplificadas. Saídas manuais usam campo notes para destino. Entregas automáticas usam delivery_id.';

