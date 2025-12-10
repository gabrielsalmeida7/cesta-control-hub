-- Migration: Adicionar desbloqueio automático de famílias
-- Data: 2025-01-XX
-- Descrição: Desbloqueia automaticamente famílias quando blocked_until expira

-- ============================================
-- 1. FUNÇÃO PARA DESBLOQUEAR FAMÍLIAS EXPIRADAS
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_unblock_expired_families()
RETURNS INTEGER AS $$
DECLARE
  v_unblocked_count INTEGER;
BEGIN
  -- Desbloquear famílias onde blocked_until já passou
  UPDATE public.families
  SET 
    is_blocked = false,
    blocked_until = NULL,
    blocked_by_institution_id = NULL,
    block_reason = NULL,
    updated_at = now()
  WHERE 
    is_blocked = true
    AND blocked_until IS NOT NULL
    AND blocked_until <= NOW();
  
  GET DIAGNOSTICS v_unblocked_count = ROW_COUNT;
  
  RETURN v_unblocked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.auto_unblock_expired_families() IS 
'Desbloqueia automaticamente famílias onde blocked_until já expirou. Retorna o número de famílias desbloqueadas.';

-- ============================================
-- 2. TRIGGER PARA DESBLOQUEIO AUTOMÁTICO
-- ============================================
-- Trigger BEFORE SELECT que verifica e desbloqueia antes de retornar dados

CREATE OR REPLACE FUNCTION public.check_and_unblock_families()
RETURNS TRIGGER AS $$
BEGIN
  -- Executar desbloqueio automático antes de retornar dados
  PERFORM public.auto_unblock_expired_families();
  RETURN NULL; -- Trigger BEFORE SELECT não retorna dados
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: PostgreSQL não suporta trigger BEFORE SELECT diretamente
-- Alternativa: Usar trigger em uma view ou executar função antes de queries importantes

-- ============================================
-- 3. TRIGGER ALTERNATIVO: BEFORE UPDATE
-- ============================================
-- Verificar e desbloquear antes de qualquer UPDATE na tabela families

CREATE OR REPLACE FUNCTION public.trigger_check_unblock_before_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Se blocked_until expirou, desbloquear automaticamente
  IF NEW.is_blocked = true AND NEW.blocked_until IS NOT NULL AND NEW.blocked_until <= NOW() THEN
    NEW.is_blocked := false;
    NEW.blocked_until := NULL;
    NEW.blocked_by_institution_id := NULL;
    NEW.block_reason := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger BEFORE UPDATE
DROP TRIGGER IF EXISTS trigger_auto_unblock_on_update ON public.families;
CREATE TRIGGER trigger_auto_unblock_on_update
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_check_unblock_before_update();

COMMENT ON TRIGGER trigger_auto_unblock_on_update ON public.families IS 
'Desbloqueia automaticamente famílias quando blocked_until expira, antes de qualquer UPDATE.';

-- ============================================
-- 4. OPÇÃO: JOB PERIÓDICO COM pg_cron (Opcional)
-- ============================================
-- Se pg_cron estiver disponível, criar job para executar periodicamente

-- Descomentar se pg_cron estiver disponível:
-- SELECT cron.schedule(
--   'auto-unblock-families',
--   '0 * * * *', -- Executar a cada hora
--   $$SELECT public.auto_unblock_expired_families();$$
-- );
