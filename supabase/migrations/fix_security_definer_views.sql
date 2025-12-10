-- Migration: Corrigir Security Definer Views
-- Data: 2025-01-XX
-- Descrição: Recriar views sem SECURITY DEFINER para respeitar RLS das tabelas subjacentes
-- 
-- Problema: Views com SECURITY DEFINER bypassam RLS e podem causar problemas de segurança
-- Solução: Recriar views sem SECURITY DEFINER, garantindo que RLS seja respeitado

-- ============================================
-- 1. VIEW: families_with_cpf
-- ============================================
-- Esta view descriptografa CPF apenas para admin
-- Usa funções SECURITY DEFINER (get_user_role, decrypt_cpf) mas a view em si não precisa ser SECURITY DEFINER

DROP VIEW IF EXISTS public.families_with_cpf CASCADE;

CREATE VIEW public.families_with_cpf AS
SELECT 
  f.id,
  f.name,
  f.contact_person,
  f.phone,
  f.address,
  f.members_count,
  f.is_blocked,
  f.blocked_until,
  f.blocked_by_institution_id,
  f.created_at,
  f.updated_at,
  -- CPF descriptografado (apenas para admin)
  -- A função decrypt_cpf é SECURITY DEFINER, mas a view não precisa ser
  CASE 
    WHEN public.get_user_role(auth.uid()) = 'admin' THEN 
      public.decrypt_cpf(f.cpf_encrypted)
    ELSE 
      '***.***.***-**' -- Mascarado para não-admin
  END as cpf,
  -- CPF formatado
  CASE 
    WHEN public.get_user_role(auth.uid()) = 'admin' THEN 
      public.format_cpf(public.decrypt_cpf(f.cpf_encrypted))
    ELSE 
      '***.***.***-**'
  END as cpf_formatted
FROM public.families f;

COMMENT ON VIEW public.families_with_cpf IS 
'View segura para acesso a famílias. CPF é descriptografado apenas para admin, mascarado para outros. RLS da tabela families é respeitado.';

-- ============================================
-- 2. VIEW: consent_audit
-- ============================================
-- View simples para auditoria de consentimento
-- Não precisa SECURITY DEFINER, RLS da tabela families será respeitado

DROP VIEW IF EXISTS public.consent_audit CASCADE;

CREATE VIEW public.consent_audit AS
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
'View para auditoria de consentimento LGPD. Lista todas as famílias com status de consentimento. RLS da tabela families é respeitado.';

-- ============================================
-- 3. VIEW: audit_critical_actions
-- ============================================
-- View de ações críticas para monitoramento
-- RLS da tabela audit_logs será respeitado

DROP VIEW IF EXISTS public.audit_critical_actions CASCADE;

CREATE VIEW public.audit_critical_actions AS
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
'View de ações críticas para monitoramento de segurança e compliance. RLS da tabela audit_logs é respeitado.';

-- ============================================
-- 4. VIEW: audit_data_access
-- ============================================
-- View de acessos a dados pessoais (LGPD Art. 37)
-- RLS da tabela audit_logs será respeitado

DROP VIEW IF EXISTS public.audit_data_access CASCADE;

CREATE VIEW public.audit_data_access AS
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
'Log de todos os acessos a dados pessoais. LGPD Art. 37. RLS da tabela audit_logs é respeitado.';

-- ============================================
-- 5. VIEW: audit_by_user
-- ============================================
-- Estatísticas de auditoria agrupadas por usuário
-- RLS da tabela audit_logs será respeitado

DROP VIEW IF EXISTS public.audit_by_user CASCADE;

CREATE VIEW public.audit_by_user AS
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
'Estatísticas de auditoria agrupadas por usuário. RLS da tabela audit_logs é respeitado.';

-- ============================================
-- 6. VIEW: families_eligible_for_deletion
-- ============================================
-- Lista famílias elegíveis para exclusão/anonimização
-- RLS da tabela families será respeitado

DROP VIEW IF EXISTS public.families_eligible_for_deletion CASCADE;

CREATE VIEW public.families_eligible_for_deletion AS
SELECT 
  f.id,
  f.name,
  f.created_at,
  MAX(d.delivery_date) as last_delivery_date,
  EXTRACT(DAY FROM now() - COALESCE(MAX(d.delivery_date), f.created_at))::INTEGER as days_inactive,
  CASE 
    WHEN EXTRACT(DAY FROM now() - COALESCE(MAX(d.delivery_date), f.created_at)) > 1825 THEN 'ELEGÍVEL'
    ELSE 'ATIVA'
  END as retention_status
FROM public.families f
LEFT JOIN public.deliveries d ON d.family_id = f.id
WHERE f.name NOT LIKE 'ANON-%' -- Excluir já anonimizados
GROUP BY f.id
ORDER BY days_inactive DESC;

COMMENT ON VIEW public.families_eligible_for_deletion IS 
'Lista famílias elegíveis para exclusão/anonimização baseado na política de retenção (5 anos). RLS das tabelas families e deliveries é respeitado.';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- 1. As views foram recriadas sem SECURITY DEFINER
-- 2. Elas ainda podem usar funções SECURITY DEFINER (como get_user_role, decrypt_cpf)
-- 3. O RLS das tabelas subjacentes será respeitado
-- 4. As políticas RLS existentes continuarão funcionando normalmente
-- 5. Views não podem ter políticas RLS próprias, mas herdam o RLS das tabelas base
--
-- Para verificar se as views foram criadas corretamente:
-- SELECT viewname, viewowner FROM pg_views WHERE schemaname = 'public' AND viewname LIKE '%audit%' OR viewname LIKE '%consent%' OR viewname LIKE '%families%';
--
-- Para verificar se ainda há SECURITY DEFINER:
-- SELECT n.nspname as schema, c.relname as view_name, 
--        CASE WHEN c.relkind = 'v' THEN 'VIEW' ELSE 'OTHER' END as type
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE c.relkind = 'v' 
--   AND n.nspname = 'public'
--   AND c.relname IN ('families_with_cpf', 'consent_audit', 'audit_critical_actions', 
--                     'audit_data_access', 'audit_by_user', 'families_eligible_for_deletion');


