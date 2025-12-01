-- Migration: Adicionar campos das Fases 2, 3 e 4 - Ficha Cadastral Natal Solidário 2025
-- Data: 2025-01-XX
-- Descrição: Adiciona campos de situação social, condições de moradia e vulnerabilidades na tabela families

-- ============================================
-- FASE 2: SITUAÇÃO SOCIAL
-- ============================================

-- Cadastro em outra instituição
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS registered_in_other_institution BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.registered_in_other_institution IS 'Indica se a família possui cadastro em outra instituição.';

-- Nome da outra instituição
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS other_institution_name TEXT;

COMMENT ON COLUMN public.families.other_institution_name IS 'Nome da instituição onde a família também está cadastrada (se aplicável).';

-- Recebe auxílio do governo
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS receives_government_aid BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.receives_government_aid IS 'Indica se a família recebe algum auxílio do governo.';

-- Auxílios específicos
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS receives_bolsa_familia BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.receives_bolsa_familia IS 'Indica se a família recebe Bolsa Família.';

ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS receives_auxilio_gas BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.receives_auxilio_gas IS 'Indica se a família recebe Auxílio Gás.';

ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS receives_bpc BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.receives_bpc IS 'Indica se a família recebe BPC (Benefício de Prestação Continuada).';

ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS receives_other_aid BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.receives_other_aid IS 'Indica se a família recebe outros auxílios do governo.';

-- Descrição de outros auxílios
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS other_aid_description TEXT;

COMMENT ON COLUMN public.families.other_aid_description IS 'Descrição de outros auxílios recebidos pela família.';

-- Deficiência ou doença crônica
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS has_chronic_disease BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.has_chronic_disease IS 'Indica se a família possui membro com deficiência ou doença crônica.';

-- Descrição da deficiência/doença crônica
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS chronic_disease_description TEXT;

COMMENT ON COLUMN public.families.chronic_disease_description IS 'Descrição da deficiência ou doença crônica (se aplicável).';

-- ============================================
-- FASE 3: CONDIÇÕES DE MORADIA
-- ============================================

-- Tipo de moradia
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS housing_type TEXT;

COMMENT ON COLUMN public.families.housing_type IS 'Tipo de moradia: Própria, Alugada, Cedida, Ocupação/Área de risco.';

-- Tipo de construção
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS construction_type TEXT;

COMMENT ON COLUMN public.families.construction_type IS 'Tipo de construção: Alvenaria, Madeira, Mista.';

-- Serviços públicos
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS has_water_supply BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.has_water_supply IS 'Indica se a família possui abastecimento de água.';

ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS has_electricity BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.has_electricity IS 'Indica se a família possui energia elétrica.';

ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS has_garbage_collection BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.has_garbage_collection IS 'Indica se a família possui coleta de lixo.';

-- ============================================
-- FASE 4: VULNERABILIDADES
-- ============================================

-- Vulnerabilidades identificadas
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS food_insecurity BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.food_insecurity IS 'Indica se a família apresenta insegurança alimentar.';

ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS unemployment BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.unemployment IS 'Indica se a família apresenta situação de desemprego.';

ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS poor_health BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.poor_health IS 'Indica se a família apresenta saúde precária.';

ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS substance_abuse BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.families.substance_abuse IS 'Indica se há dependência química na família.';

-- Outras vulnerabilidades
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS other_vulnerabilities TEXT;

COMMENT ON COLUMN public.families.other_vulnerabilities IS 'Descrição de outras vulnerabilidades identificadas.';

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para busca por tipo de moradia
CREATE INDEX IF NOT EXISTS idx_families_housing_type 
ON public.families(housing_type) 
WHERE housing_type IS NOT NULL;

-- Índice para busca por vulnerabilidades
CREATE INDEX IF NOT EXISTS idx_families_food_insecurity 
ON public.families(food_insecurity) 
WHERE food_insecurity = TRUE;

CREATE INDEX IF NOT EXISTS idx_families_substance_abuse 
ON public.families(substance_abuse) 
WHERE substance_abuse = TRUE;

-- Índice para busca por auxílios
CREATE INDEX IF NOT EXISTS idx_families_receives_government_aid 
ON public.families(receives_government_aid) 
WHERE receives_government_aid = TRUE;

