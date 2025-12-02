-- Migration: Script de Verificação das Correções de Segurança
-- Data: 2025-01-XX
-- Descrição: Scripts SQL para verificar se as correções de segurança foram aplicadas corretamente
-- 
-- Este arquivo contém queries úteis para verificar:
-- 1. Se as views foram recriadas sem SECURITY DEFINER
-- 2. Se RLS está habilitado em todas as tabelas
-- 3. Se as políticas RLS foram criadas corretamente

-- ============================================
-- 1. VERIFICAR VIEWS SEM SECURITY DEFINER
-- ============================================

-- Verificar se as views existem e não são SECURITY DEFINER
-- Nota: Views não podem ter SECURITY DEFINER diretamente, mas podem usar funções SECURITY DEFINER
-- O importante é que as views respeitem RLS das tabelas subjacentes

SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views
WHERE schemaname = 'public' 
  AND viewname IN (
    'families_with_cpf',
    'consent_audit',
    'audit_critical_actions',
    'audit_data_access',
    'audit_by_user',
    'families_eligible_for_deletion'
  )
ORDER BY viewname;

-- ============================================
-- 2. VERIFICAR RLS HABILITADO EM TODAS AS TABELAS
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ Habilitado'
    ELSE '❌ Desabilitado - CORRIGIR!'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'institution_families',
    'profiles',
    'institutions',
    'families',
    'deliveries',
    'stock_movements',
    'suppliers',
    'products',
    'inventory',
    'receipts',
    'consent_change_log'
  )
ORDER BY 
  CASE WHEN rowsecurity THEN 0 ELSE 1 END, -- Desabilitados primeiro
  tablename;

-- ============================================
-- 3. VERIFICAR POLÍTICAS RLS CRIADAS
-- ============================================

-- Resumo de políticas por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
  COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) as all_policies,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ SEM POLÍTICAS - CORRIGIR!'
    ELSE '✅ OK'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'institution_families',
    'profiles',
    'institutions',
    'families',
    'deliveries',
    'stock_movements',
    'suppliers',
    'products',
    'inventory',
    'receipts',
    'consent_change_log'
  )
GROUP BY tablename
ORDER BY 
  CASE WHEN COUNT(*) = 0 THEN 0 ELSE 1 END, -- Sem políticas primeiro
  tablename;

-- ============================================
-- 4. LISTAR TODAS AS POLÍTICAS DETALHADAS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command_type,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'institution_families',
    'profiles',
    'institutions',
    'families',
    'deliveries',
    'stock_movements',
    'suppliers',
    'products',
    'inventory',
    'receipts',
    'consent_change_log'
  )
ORDER BY tablename, policyname;

-- ============================================
-- 5. VERIFICAR FUNÇÕES SECURITY DEFINER USADAS
-- ============================================
-- Estas funções devem permanecer SECURITY DEFINER para funcionar em políticas RLS

SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) LIKE '%SECURITY DEFINER%' as is_security_definer,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SECURITY DEFINER%' THEN '✅ OK (necessário para RLS)'
    ELSE '⚠️ Não é SECURITY DEFINER'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_role', 'get_user_institution', 'decrypt_cpf', 'encrypt_cpf')
ORDER BY p.proname;

-- ============================================
-- 6. TESTE DE ACESSO (EXEMPLO)
-- ============================================
-- Execute estes testes após aplicar as migrations para verificar se RLS está funcionando
--
-- Como ADMIN (substitua 'admin-user-id' pelo UUID de um usuário admin):
-- SELECT * FROM public.families LIMIT 5; -- Deve retornar todas as famílias
-- SELECT * FROM public.institutions LIMIT 5; -- Deve retornar todas as instituições
--
-- Como INSTITUIÇÃO (substitua 'institution-user-id' pelo UUID de um usuário de instituição):
-- SELECT * FROM public.families LIMIT 5; -- Deve retornar apenas famílias associadas
-- SELECT * FROM public.institutions LIMIT 5; -- Deve retornar apenas própria instituição
-- SELECT * FROM public.stock_movements LIMIT 5; -- Deve retornar apenas movimentações próprias
--
-- Como INSTITUIÇÃO tentando acessar dados de outra instituição:
-- SELECT * FROM public.stock_movements WHERE institution_id != public.get_user_institution(auth.uid()); 
-- -- Deve retornar 0 linhas

-- ============================================
-- 7. VERIFICAR ÍNDICES PARA PERFORMANCE
-- ============================================
-- Políticas RLS podem impactar performance. Verificar se existem índices nas colunas usadas

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexdef LIKE '%institution_id%' OR
    indexdef LIKE '%user_id%' OR
    indexdef LIKE '%family_id%'
  )
  AND tablename IN (
    'institution_families',
    'profiles',
    'institutions',
    'families',
    'deliveries',
    'stock_movements',
    'inventory',
    'receipts',
    'consent_change_log'
  )
ORDER BY tablename, indexname;

-- ============================================
-- RESUMO FINAL
-- ============================================
-- 
-- Após executar este script, verifique:
-- 1. ✅ Todas as tabelas têm RLS habilitado (coluna rls_enabled = true)
-- 2. ✅ Todas as tabelas têm pelo menos uma política RLS
-- 3. ✅ Funções auxiliares (get_user_role, get_user_institution) são SECURITY DEFINER
-- 4. ✅ Índices existem nas colunas usadas pelas políticas (institution_id, user_id, etc.)
--
-- Se algum item estiver marcado com ⚠️ ou ❌, execute as migrations novamente ou corrija manualmente.

