-- Migration: Sistema de Logs de Auditoria LGPD
-- Data: 2025-01-XX
-- Descrição: Cria sistema completo de auditoria para compliance LGPD Art. 37

-- ============================================
-- 1. TABELA DE LOGS DE AUDITORIA
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Informações do usuário
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  
  -- Informações da ação
  action_type TEXT NOT NULL CHECK (action_type IN (
    'INSERT', 'UPDATE', 'DELETE', 
    'LOGIN', 'LOGOUT', 'FAILED_LOGIN',
    'CONSENT_GIVEN', 'CONSENT_REVOKED',
    'DATA_ACCESS', 'DATA_EXPORT', 'DATA_DELETE',
    'FAMILY_UNBLOCK', 'DELIVERY_CREATE',
    'PASSWORD_RESET', 'PASSWORD_CHANGE'
  )),
  table_name TEXT,
  record_id UUID,
  
  -- Detalhes da mudança
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  
  -- Informações técnicas
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  
  -- Observações
  description TEXT,
  severity TEXT CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')) DEFAULT 'INFO',
  
  -- Índices para performance
  CONSTRAINT audit_logs_action_not_empty CHECK (length(trim(action_type)) > 0)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON public.audit_logs(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type 
ON public.audit_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record 
ON public.audit_logs(table_name, record_id) 
WHERE table_name IS NOT NULL AND record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_severity 
ON public.audit_logs(severity) 
WHERE severity IN ('WARNING', 'CRITICAL');

-- Particionamento por data (opcional, para grandes volumes)
-- CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

COMMENT ON TABLE public.audit_logs IS 
'Tabela de auditoria para rastreamento de todas as operações críticas. LGPD Art. 37 - Registro das operações de tratamento de dados.';

COMMENT ON COLUMN public.audit_logs.action_type IS 
'Tipo de ação realizada. Categorias principais: operações de BD, autenticação, consentimento, acesso a dados.';

COMMENT ON COLUMN public.audit_logs.changed_fields IS 
'Array com nomes dos campos que foram alterados (apenas para UPDATE).';

COMMENT ON COLUMN public.audit_logs.severity IS 
'Nível de severidade: INFO (operações normais), WARNING (operações sensíveis), CRITICAL (operações de alto risco).';

-- ============================================
-- 2. FUNÇÃO GENÉRICA PARA AUDITORIA
-- ============================================

CREATE OR REPLACE FUNCTION public.audit_log(
  p_action_type TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'INFO'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_changed_fields TEXT[];
BEGIN
  -- Obter informações do usuário atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email, raw_user_meta_data->>'role' 
    INTO v_user_email, v_user_role
    FROM auth.users 
    WHERE id = v_user_id;
  END IF;
  
  -- Calcular campos alterados (se for UPDATE)
  IF p_action_type = 'UPDATE' AND p_old_data IS NOT NULL AND p_new_data IS NOT NULL THEN
    SELECT array_agg(key)
    INTO v_changed_fields
    FROM jsonb_each(p_new_data) new
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_each(p_old_data) old
      WHERE old.key = new.key AND old.value = new.value
    );
  END IF;
  
  -- Inserir log
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_role,
    action_type,
    table_name,
    record_id,
    old_data,
    new_data,
    changed_fields,
    description,
    severity
  ) VALUES (
    v_user_id,
    v_user_email,
    v_user_role,
    p_action_type,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    v_changed_fields,
    p_description,
    p_severity
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.audit_log IS 
'Função genérica para registrar logs de auditoria. Captura automaticamente informações do usuário e calcula campos alterados.';

-- ============================================
-- 3. TRIGGERS AUTOMÁTICOS PARA TABELAS
-- ============================================

-- Função genérica para trigger de auditoria
CREATE OR REPLACE FUNCTION public.trigger_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_action_type TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id UUID;
BEGIN
  -- Determinar tipo de ação
  CASE TG_OP
    WHEN 'INSERT' THEN
      v_action_type := 'INSERT';
      v_new_data := to_jsonb(NEW);
      v_record_id := NEW.id;
    WHEN 'UPDATE' THEN
      v_action_type := 'UPDATE';
      v_old_data := to_jsonb(OLD);
      v_new_data := to_jsonb(NEW);
      v_record_id := NEW.id;
    WHEN 'DELETE' THEN
      v_action_type := 'DELETE';
      v_old_data := to_jsonb(OLD);
      v_record_id := OLD.id;
  END CASE;
  
  -- Registrar log
  PERFORM public.audit_log(
    p_action_type := v_action_type,
    p_table_name := TG_TABLE_NAME,
    p_record_id := v_record_id,
    p_old_data := v_old_data,
    p_new_data := v_new_data,
    p_description := format('%s on %s', TG_OP, TG_TABLE_NAME)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas críticas
DROP TRIGGER IF EXISTS trigger_audit_families ON public.families;
CREATE TRIGGER trigger_audit_families
  AFTER INSERT OR UPDATE OR DELETE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trigger_audit_deliveries ON public.deliveries;
CREATE TRIGGER trigger_audit_deliveries
  AFTER INSERT OR UPDATE OR DELETE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trigger_audit_institutions ON public.institutions;
CREATE TRIGGER trigger_audit_institutions
  AFTER INSERT OR UPDATE OR DELETE ON public.institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_audit_log();

DROP TRIGGER IF EXISTS trigger_audit_profiles ON public.profiles;
CREATE TRIGGER trigger_audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_audit_log();

-- ============================================
-- 4. VIEWS PARA RELATÓRIOS DE AUDITORIA
-- ============================================

-- View de ações críticas recentes
CREATE OR REPLACE VIEW public.audit_critical_actions AS
SELECT 
  al.id,
  al.created_at,
  al.user_email,
  al.user_role,
  al.action_type,
  al.table_name,
  al.record_id,
  al.description,
  al.severity
FROM public.audit_logs al
WHERE al.severity IN ('WARNING', 'CRITICAL')
   OR al.action_type IN ('DELETE', 'CONSENT_REVOKED', 'DATA_DELETE', 'FAMILY_UNBLOCK')
ORDER BY al.created_at DESC;

COMMENT ON VIEW public.audit_critical_actions IS 
'View de ações críticas para monitoramento de segurança e compliance.';

-- View de auditoria por usuário
CREATE OR REPLACE VIEW public.audit_by_user AS
SELECT 
  al.user_id,
  al.user_email,
  al.user_role,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE al.severity = 'CRITICAL') as critical_actions,
  COUNT(*) FILTER (WHERE al.action_type = 'DELETE') as delete_actions,
  MAX(al.created_at) as last_action_at
FROM public.audit_logs al
WHERE al.user_id IS NOT NULL
GROUP BY al.user_id, al.user_email, al.user_role
ORDER BY total_actions DESC;

COMMENT ON VIEW public.audit_by_user IS 
'Estatísticas de auditoria agrupadas por usuário.';

-- View de acessos a dados pessoais
CREATE OR REPLACE VIEW public.audit_data_access AS
SELECT 
  al.id,
  al.created_at,
  al.user_email,
  al.action_type,
  al.table_name,
  al.record_id,
  al.description,
  CASE 
    WHEN al.table_name = 'families' THEN 'Dados de Famílias (Titular)'
    WHEN al.table_name = 'deliveries' THEN 'Histórico de Entregas'
    WHEN al.table_name = 'profiles' THEN 'Dados de Usuários'
    ELSE al.table_name
  END as data_type
FROM public.audit_logs al
WHERE al.action_type IN ('DATA_ACCESS', 'DATA_EXPORT', 'INSERT', 'UPDATE')
  AND al.table_name IN ('families', 'deliveries', 'profiles')
ORDER BY al.created_at DESC;

COMMENT ON VIEW public.audit_data_access IS 
'Log de todos os acessos a dados pessoais. LGPD Art. 37.';

-- ============================================
-- 5. FUNÇÃO PARA LIMPEZA DE LOGS ANTIGOS
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
  p_retention_days INTEGER DEFAULT 1825 -- 5 anos padrão
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < (now() - (p_retention_days || ' days')::INTERVAL)
    AND severity = 'INFO';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Registrar própria limpeza
  PERFORM public.audit_log(
    p_action_type := 'DELETE',
    p_table_name := 'audit_logs',
    p_description := format('Cleanup: removed %s old audit logs (retention: %s days)', 
                          v_deleted_count, p_retention_days),
    p_severity := 'INFO'
  );
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 
'Remove logs de auditoria INFO antigos. Mantém logs CRITICAL e WARNING indefinidamente. Padrão: 5 anos (1825 dias).';

-- ============================================
-- 6. RLS (ROW LEVEL SECURITY) PARA AUDIT_LOGS
-- ============================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin pode ver todos os logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Ninguém pode modificar logs (apenas inserção via triggers/funções)
-- Não criar políticas de UPDATE/DELETE

COMMENT ON POLICY "Admins can view all audit logs" ON public.audit_logs IS 
'Administradores podem visualizar todos os logs de auditoria para fins de compliance.';

COMMENT ON POLICY "Users can view own audit logs" ON public.audit_logs IS 
'Usuários podem visualizar seus próprios logs de auditoria (transparência LGPD).';

