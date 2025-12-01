-- Migration: Adicionar campos de cadastro conforme Ficha Cadastral Natal Solidário 2025
-- Data: 2025-01-XX
-- Descrição: Adiciona campos essenciais da ficha cadastral na tabela families

-- ============================================
-- 1. DADOS DO RESPONSÁVEL PELA FAMÍLIA
-- ============================================

-- Nome da mãe
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS mother_name TEXT;

COMMENT ON COLUMN public.families.mother_name IS 'Nome da mãe do responsável pela família.';

-- Data de nascimento
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN public.families.birth_date IS 'Data de nascimento do responsável pela família.';

-- ID (RG ou outro documento)
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS id_document TEXT;

COMMENT ON COLUMN public.families.id_document IS 'Número do documento de identidade (RG ou outro) do responsável.';

-- Profissão/ocupação atual
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS occupation TEXT;

COMMENT ON COLUMN public.families.occupation IS 'Profissão ou ocupação atual do responsável pela família.';

-- Situação de trabalho
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS work_situation TEXT;

COMMENT ON COLUMN public.families.work_situation IS 'Situação de trabalho: Empregado, Desempregado, Autônomo, Aposentado, Outros.';

-- Quantos filhos
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.families.children_count IS 'Quantidade de filhos do responsável pela família.';

-- Possui deficiência na família
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS has_disability BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.has_disability IS 'Indica se a família possui membro com deficiência.';

-- ============================================
-- 2. ENDEREÇO
-- ============================================

-- Ponto de referência
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS address_reference TEXT;

COMMENT ON COLUMN public.families.address_reference IS 'Ponto de referência do endereço da família.';

-- ============================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para busca por data de nascimento
CREATE INDEX IF NOT EXISTS idx_families_birth_date 
ON public.families(birth_date) 
WHERE birth_date IS NOT NULL;

-- Índice para busca por situação de trabalho
CREATE INDEX IF NOT EXISTS idx_families_work_situation 
ON public.families(work_situation) 
WHERE work_situation IS NOT NULL;

-- Índice para busca por deficiência
CREATE INDEX IF NOT EXISTS idx_families_has_disability 
ON public.families(has_disability) 
WHERE has_disability = TRUE;

-- ============================================
-- 4. CONSTRAINTS
-- ============================================

-- Constraint para children_count não negativo
ALTER TABLE public.families 
ADD CONSTRAINT families_children_count_non_negative 
CHECK (children_count >= 0);

-- Constraint para birth_date não pode ser futura
ALTER TABLE public.families 
ADD CONSTRAINT families_birth_date_not_future 
CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE);

