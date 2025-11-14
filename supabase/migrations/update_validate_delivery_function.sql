-- ============================================
-- Atualizar função validate_delivery para permitir entrega com justificativa
-- quando família está bloqueada
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_delivery(
  p_family_id UUID,
  p_institution_id UUID,
  p_blocking_justification TEXT DEFAULT NULL
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
      -- Se família está bloqueada, justificativa é obrigatória
      IF p_blocking_justification IS NULL OR TRIM(p_blocking_justification) = '' THEN
        RETURN jsonb_build_object(
          'valid', false,
          'error', 'BLOCKING_JUSTIFICATION_REQUIRED',
          'message', format('Esta família está bloqueada pela instituição %s até %s. Para realizar esta entrega, é necessário fornecer uma justificativa explicando o motivo.', 
            COALESCE(v_family.blocked_by_institution_name, 'outra instituição'),
            to_char(v_family.blocked_until, 'DD/MM/YYYY')
          ),
          'blocked_until', v_family.blocked_until,
          'blocked_by_institution_name', v_family.blocked_by_institution_name,
          'requires_justification', true
        );
      END IF;
      
      -- Se justificativa foi fornecida, permitir entrega (mas retornar aviso)
      RETURN jsonb_build_object(
        'valid', true,
        'message', format('Entrega permitida com justificativa. Família bloqueada pela instituição %s até %s.', 
          COALESCE(v_family.blocked_by_institution_name, 'outra instituição'),
          to_char(v_family.blocked_until, 'DD/MM/YYYY')
        ),
        'warning', true,
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
COMMENT ON FUNCTION public.validate_delivery(UUID, UUID, TEXT) IS 
'Valida se uma entrega pode ser realizada. Verifica se família existe, está vinculada à instituição e se justificativa foi fornecida quando família está bloqueada.';

