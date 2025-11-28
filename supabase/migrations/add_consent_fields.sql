-- Migration: Adicionar campos de consentimento LGPD na tabela families
-- Data: 2025-01-XX
-- Descrição: Adiciona campos para gerenciamento de consentimento conforme LGPD

-- ============================================
-- 1. ADICIONAR CAMPOS DE CONSENTIMENTO
-- ============================================

-- Consentimento digital (checkbox no sistema)
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;

-- Geração do termo impresso
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS consent_term_generated_at TIMESTAMPTZ;

-- ID único do termo gerado
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS consent_term_id TEXT;

-- Confirmação de assinatura física do termo
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS consent_term_signed BOOLEAN DEFAULT FALSE;

-- Revogação do consentimento
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS consent_revoked_at TIMESTAMPTZ;

-- Motivo da revogação
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS consent_revocation_reason TEXT;

-- ============================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para buscar famílias por status de consentimento
CREATE INDEX IF NOT EXISTS idx_families_consent_given 
ON public.families(consent_given_at) 
WHERE consent_given_at IS NOT NULL;

-- Índice para buscar famílias com termo gerado
CREATE INDEX IF NOT EXISTS idx_families_term_generated 
ON public.families(consent_term_generated_at) 
WHERE consent_term_generated_at IS NOT NULL;

-- Índice para buscar famílias com consentimento revogado
CREATE INDEX IF NOT EXISTS idx_families_consent_revoked 
ON public.families(consent_revoked_at) 
WHERE consent_revoked_at IS NOT NULL;

-- ============================================
-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN public.families.consent_given_at IS 
'Data e hora em que o titular deu consentimento digital (checkbox) no sistema. LGPD Art. 8º.';

COMMENT ON COLUMN public.families.consent_term_generated_at IS 
'Data e hora em que o termo de consentimento impresso foi gerado. Usado para rastreabilidade.';

COMMENT ON COLUMN public.families.consent_term_id IS 
'ID único do termo de consentimento gerado. Formato: TERMO-{timestamp}-{random}. Permite localizar o documento físico arquivado.';

COMMENT ON COLUMN public.families.consent_term_signed IS 
'Indica se o termo de consentimento impresso foi assinado fisicamente pelo titular. TRUE após confirmação de assinatura.';

COMMENT ON COLUMN public.families.consent_revoked_at IS 
'Data e hora em que o consentimento foi revogado pelo titular. LGPD Art. 18, IX.';

COMMENT ON COLUMN public.families.consent_revocation_reason IS 
'Motivo da revogação do consentimento informado pelo titular.';

-- ============================================
-- 4. FUNÇÃO PARA VERIFICAR CONSENTIMENTO VÁLIDO
-- ============================================

CREATE OR REPLACE FUNCTION public.has_valid_consent(family_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_family RECORD;
BEGIN
  SELECT 
    consent_given_at,
    consent_term_signed,
    consent_revoked_at
  INTO v_family
  FROM public.families
  WHERE id = family_id;
  
  -- Se não encontrou a família
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Se consentimento foi revogado, não é válido
  IF v_family.consent_revoked_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Deve ter consentimento digital OU termo assinado
  RETURN (
    v_family.consent_given_at IS NOT NULL OR 
    v_family.consent_term_signed = TRUE
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.has_valid_consent(UUID) IS 
'Verifica se uma família possui consentimento válido para tratamento de dados. Retorna FALSE se consentimento foi revogado ou nunca foi dado.';

-- ============================================
-- 5. VIEW PARA AUDITORIA DE CONSENTIMENTO
-- ============================================

CREATE OR REPLACE VIEW public.consent_audit AS
SELECT 
  f.id as family_id,
  f.name as family_name,
  f.cpf,
  f.consent_given_at,
  f.consent_term_generated_at,
  f.consent_term_id,
  f.consent_term_signed,
  f.consent_revoked_at,
  f.consent_revocation_reason,
  CASE 
    WHEN f.consent_revoked_at IS NOT NULL THEN 'REVOGADO'
    WHEN (f.consent_given_at IS NOT NULL OR f.consent_term_signed = TRUE) THEN 'VÁLIDO'
    ELSE 'SEM CONSENTIMENTO'
  END as consent_status,
  f.created_at as family_created_at
FROM public.families f
ORDER BY f.created_at DESC;

COMMENT ON VIEW public.consent_audit IS 
'View para auditoria de consentimento LGPD. Lista todas as famílias com status de consentimento.';

-- ============================================
-- 6. TRIGGER PARA LOG DE MUDANÇAS (OPCIONAL)
-- ============================================

-- Criar tabela de log de consentimento
CREATE TABLE IF NOT EXISTS public.consent_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('CONSENT_GIVEN', 'TERM_GENERATED', 'TERM_SIGNED', 'CONSENT_REVOKED')),
  change_at TIMESTAMPTZ DEFAULT now(),
  changed_by_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  CONSTRAINT consent_change_log_type_check CHECK (length(trim(change_type)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_consent_log_family 
ON public.consent_change_log(family_id, change_at);

CREATE INDEX IF NOT EXISTS idx_consent_log_type 
ON public.consent_change_log(change_type);

COMMENT ON TABLE public.consent_change_log IS 
'Log de auditoria de mudanças relacionadas a consentimento. Rastreia todas as alterações para compliance LGPD Art. 37.';

-- Função para registrar mudança de consentimento
CREATE OR REPLACE FUNCTION public.log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se consent_given_at foi definido
  IF OLD.consent_given_at IS NULL AND NEW.consent_given_at IS NOT NULL THEN
    INSERT INTO public.consent_change_log (family_id, change_type, details)
    VALUES (NEW.id, 'CONSENT_GIVEN', jsonb_build_object('given_at', NEW.consent_given_at));
  END IF;
  
  -- Se termo foi gerado
  IF OLD.consent_term_generated_at IS NULL AND NEW.consent_term_generated_at IS NOT NULL THEN
    INSERT INTO public.consent_change_log (family_id, change_type, details)
    VALUES (NEW.id, 'TERM_GENERATED', jsonb_build_object(
      'term_id', NEW.consent_term_id,
      'generated_at', NEW.consent_term_generated_at
    ));
  END IF;
  
  -- Se termo foi assinado
  IF (OLD.consent_term_signed IS NULL OR OLD.consent_term_signed = FALSE) 
     AND NEW.consent_term_signed = TRUE THEN
    INSERT INTO public.consent_change_log (family_id, change_type, details)
    VALUES (NEW.id, 'TERM_SIGNED', jsonb_build_object('signed', TRUE));
  END IF;
  
  -- Se consentimento foi revogado
  IF OLD.consent_revoked_at IS NULL AND NEW.consent_revoked_at IS NOT NULL THEN
    INSERT INTO public.consent_change_log (family_id, change_type, details)
    VALUES (NEW.id, 'CONSENT_REVOKED', jsonb_build_object(
      'revoked_at', NEW.consent_revoked_at,
      'reason', NEW.consent_revocation_reason
    ));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_log_consent_change ON public.families;
CREATE TRIGGER trigger_log_consent_change
  AFTER UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.log_consent_change();

COMMENT ON FUNCTION public.log_consent_change() IS 
'Trigger function que registra automaticamente mudanças relacionadas a consentimento na tabela consent_change_log.';

