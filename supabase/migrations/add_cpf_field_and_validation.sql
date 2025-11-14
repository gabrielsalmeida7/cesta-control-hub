-- Migration: Adicionar campo CPF na tabela families e função de validação de entrega
-- Data: 2025-01-XX
-- Descrição: Adiciona campo CPF único na tabela families e cria função para validar entregas

-- ============================================
-- 1. ADICIONAR CAMPO CPF NA TABELA FAMILIES
-- ============================================

-- Adicionar coluna CPF (opcional, mas único quando preenchido)
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Criar índice para busca rápida por CPF
CREATE INDEX IF NOT EXISTS idx_families_cpf ON public.families(cpf) WHERE cpf IS NOT NULL;

-- Adicionar constraint de unicidade para CPF (apenas quando não for NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_families_cpf_unique ON public.families(cpf) WHERE cpf IS NOT NULL;

-- Função para validar formato de CPF brasileiro (11 dígitos, apenas números)
CREATE OR REPLACE FUNCTION public.validate_cpf_format(cpf_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remove caracteres não numéricos
  cpf_text := regexp_replace(cpf_text, '[^0-9]', '', 'g');
  
  -- Verifica se tem 11 dígitos
  IF length(cpf_text) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se não é uma sequência de números iguais (ex: 111.111.111-11)
  IF cpf_text ~ '^(\d)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Adicionar constraint de validação de formato CPF (opcional, pode ser validado no frontend também)
-- Comentado porque pode ser muito restritivo, mas pode ser habilitado se necessário
-- ALTER TABLE public.families 
-- ADD CONSTRAINT families_cpf_format_check 
-- CHECK (cpf IS NULL OR validate_cpf_format(cpf) = TRUE);

-- Comentário na coluna
COMMENT ON COLUMN public.families.cpf IS 'CPF da família (identificador único). Formato: 11 dígitos numéricos.';

-- ============================================
-- 2. FUNÇÃO DE VALIDAÇÃO DE ENTREGA
-- ============================================

-- Função para validar se uma entrega pode ser realizada
CREATE OR REPLACE FUNCTION public.validate_delivery(
  p_family_id UUID,
  p_institution_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_family RECORD;
  v_is_associated BOOLEAN;
  v_error_message TEXT;
  v_result JSONB;
BEGIN
  -- Buscar dados da família
  SELECT 
    f.id,
    f.name,
    f.is_blocked,
    f.blocked_until,
    f.blocked_by_institution_id,
    i.name as blocked_by_institution_name
  INTO v_family
  FROM public.families f
  LEFT JOIN public.institutions i ON i.id = f.blocked_by_institution_id
  WHERE f.id = p_family_id;
  
  -- Verificar se família existe
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'FAMILY_NOT_FOUND',
      'message', 'Família não encontrada.'
    );
  END IF;
  
  -- Verificar se família está bloqueada
  IF v_family.is_blocked = TRUE AND v_family.blocked_until IS NOT NULL THEN
    -- Verificar se o bloqueio ainda está ativo
    IF v_family.blocked_until > NOW() THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'FAMILY_BLOCKED',
        'message', format('Esta família já foi atendida pela instituição %s. Não é possível realizar nova entrega até %s.', 
          COALESCE(v_family.blocked_by_institution_name, 'outra instituição'),
          to_char(v_family.blocked_until, 'DD/MM/YYYY')
        ),
        'blocked_until', v_family.blocked_until,
        'blocked_by_institution_name', v_family.blocked_by_institution_name
      );
    END IF;
  END IF;
  
  -- Verificar se família está vinculada à instituição
  SELECT EXISTS(
    SELECT 1 
    FROM public.institution_families 
    WHERE family_id = p_family_id 
    AND institution_id = p_institution_id
  ) INTO v_is_associated;
  
  IF NOT v_is_associated THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'FAMILY_NOT_ASSOCIATED',
      'message', 'Esta família não está vinculada à sua instituição. Por favor, vincule a família primeiro.'
    );
  END IF;
  
  -- Tudo OK
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Validação aprovada.'
  );
END;
$$ LANGUAGE plpgsql;

-- Comentário na função
COMMENT ON FUNCTION public.validate_delivery(UUID, UUID) IS 
'Valida se uma entrega pode ser realizada. Verifica se família existe, não está bloqueada e está vinculada à instituição.';

-- ============================================
-- 3. ADICIONAR CAMPO unblock_reason NA TABELA FAMILIES (para auditoria)
-- ============================================

-- Adicionar coluna para registrar motivo do desbloqueio manual
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS unblock_reason TEXT;

-- Adicionar coluna para registrar quem desbloqueou
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS unblocked_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar coluna para registrar quando foi desbloqueado
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS unblocked_at TIMESTAMPTZ;

-- Comentários
COMMENT ON COLUMN public.families.unblock_reason IS 'Motivo do desbloqueio manual realizado por admin.';
COMMENT ON COLUMN public.families.unblocked_by_user_id IS 'ID do usuário admin que realizou o desbloqueio manual.';
COMMENT ON COLUMN public.families.unblocked_at IS 'Data e hora do desbloqueio manual.';

