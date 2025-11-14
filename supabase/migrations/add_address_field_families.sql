-- Migration: Adicionar campo address na tabela families
-- Data: 2025-01-XX
-- Descrição: Adiciona campo de endereço na tabela families

-- Adicionar coluna address (opcional)
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Comentário na coluna
COMMENT ON COLUMN public.families.address IS 'Endereço completo da família (rua, número, bairro, cidade, etc.).';

