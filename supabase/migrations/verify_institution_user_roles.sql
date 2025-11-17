-- Script de Verificação: Role 'institution' para Novos Usuários
-- Data: 2025-11-17
-- Descrição: Verifica se novos usuários de instituição recebem role 'institution' corretamente

-- ============================================
-- 1. VERIFICAR TODOS OS PERFIS DE INSTITUIÇÃO
-- ============================================

SELECT 
  p.id,
  p.email,
  p.role,
  p.institution_id,
  p.full_name,
  i.name as institution_name,
  p.created_at,
  CASE 
    WHEN p.role = 'institution' AND p.institution_id IS NOT NULL THEN '✅ Correto'
    WHEN p.role = 'institution' AND p.institution_id IS NULL THEN '❌ ERRO: institution_id NULL'
    WHEN p.role != 'institution' AND p.institution_id IS NOT NULL THEN '❌ ERRO: Role incorreto'
    ELSE '⚠️ Verificar'
  END as status
FROM profiles p
LEFT JOIN institutions i ON p.institution_id = i.id
WHERE p.role = 'institution'
ORDER BY p.created_at DESC;

-- ============================================
-- 2. VERIFICAR PERFIS COM PROBLEMAS
-- ============================================

-- Perfis com role 'institution' mas sem institution_id
SELECT 
  'Perfis institution sem institution_id' as problema,
  COUNT(*) as total,
  array_agg(email) as emails
FROM profiles
WHERE role = 'institution' 
  AND institution_id IS NULL;

-- Perfis com institution_id mas role diferente de 'institution'
SELECT 
  'Perfis com institution_id mas role incorreto' as problema,
  COUNT(*) as total,
  array_agg(email) as emails,
  array_agg(role) as roles_incorretos
FROM profiles
WHERE institution_id IS NOT NULL 
  AND role != 'institution';

-- ============================================
-- 3. VERIFICAR FUNÇÃO link_institution_user
-- ============================================

-- Verificar se a função existe e está correta
SELECT 
  routine_name,
  CASE 
    WHEN routine_definition LIKE '%role = ''institution''%' THEN '✅ Define role corretamente'
    ELSE '❌ ERRO: Não define role como institution'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'link_institution_user';

-- ============================================
-- 4. VERIFICAR DEFINIÇÃO DA FUNÇÃO link_institution_user
-- ============================================

-- Verificar se a função link_institution_user está configurada corretamente
SELECT 
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'link_institution_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================
-- 5. VERIFICAR USUÁRIOS RECÉM-CRIADOS
-- ============================================

-- Usuários criados nas últimas 24 horas
SELECT 
  p.id,
  p.email,
  p.role,
  p.institution_id,
  i.name as institution_name,
  p.created_at,
  CASE 
    WHEN p.role = 'institution' AND p.institution_id IS NOT NULL THEN '✅ Correto'
    ELSE '❌ ERRO'
  END as status
FROM profiles p
LEFT JOIN institutions i ON p.institution_id = i.id
WHERE p.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY p.created_at DESC;

-- ============================================
-- 6. VERIFICAR CONSTRAINT profiles_institution_logic
-- ============================================

-- Verificar se a constraint está funcionando
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  CASE 
    WHEN conname = 'profiles_institution_logic' THEN '✅ Constraint existe'
    ELSE '⚠️ Verificar'
  END as status
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname = 'profiles_institution_logic';

-- ============================================
-- 7. TESTE PRÁTICO: CRIAR NOVO USUÁRIO E VERIFICAR
-- ============================================

-- INSTRUÇÕES PARA TESTE MANUAL:
-- 1. Criar uma nova instituição via interface admin
-- 2. Verificar se o perfil foi criado com role = 'institution'
-- 3. Executar a query abaixo para verificar o último usuário criado

SELECT 
  p.id,
  p.email,
  p.role,
  p.institution_id,
  i.name as institution_name,
  p.created_at,
  CASE 
    WHEN p.role = 'institution' AND p.institution_id IS NOT NULL THEN '✅ TESTE PASSOU'
    ELSE '❌ TESTE FALHOU'
  END as resultado_teste
FROM profiles p
LEFT JOIN institutions i ON p.institution_id = i.id
WHERE p.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================
-- 8. RESUMO FINAL
-- ============================================

SELECT 
  'RESUMO PERFIS INSTITUIÇÃO' as verificacao,
  (SELECT COUNT(*) FROM profiles WHERE role = 'institution') as total_perfis_institution,
  (SELECT COUNT(*) FROM profiles WHERE role = 'institution' AND institution_id IS NOT NULL) as perfis_corretos,
  (SELECT COUNT(*) FROM profiles WHERE role = 'institution' AND institution_id IS NULL) as perfis_sem_institution_id,
  (SELECT COUNT(*) FROM profiles WHERE institution_id IS NOT NULL AND role != 'institution') as perfis_com_role_incorreta,
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles WHERE role = 'institution' AND institution_id IS NULL) = 0 
      AND (SELECT COUNT(*) FROM profiles WHERE institution_id IS NOT NULL AND role != 'institution') = 0
    THEN '✅ Todos os perfis estão corretos'
    ELSE '❌ Há perfis com problemas'
  END as status_geral;

