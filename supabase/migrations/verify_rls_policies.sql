-- Script de Verificação: RLS (Row Level Security) no Banco
-- Data: 2025-11-17
-- Descrição: Verifica se RLS está habilitado e se as políticas estão corretas

-- ============================================
-- 1. VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ Habilitado'
    ELSE '❌ Desabilitado'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'families', 'institutions', 'deliveries', 'institution_families')
ORDER BY tablename;

-- ============================================
-- 2. VERIFICAR POLÍTICAS RLS EXISTENTES
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
  AND tablename IN ('profiles', 'families', 'institutions', 'deliveries', 'institution_families')
ORDER BY tablename, policyname;

-- ============================================
-- 3. RESUMO DE POLÍTICAS POR TABELA
-- ============================================

SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
  COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) as all_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'families', 'institutions', 'deliveries', 'institution_families')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 4. VERIFICAR POLÍTICAS ESPECÍFICAS ESPERADAS
-- ============================================

-- Políticas esperadas para profiles
SELECT 
  'profiles' as tabela,
  policyname,
  CASE 
    WHEN policyname IN (
      'Users can view own profile',
      'Users can update own profile',
      'Admins can view all profiles'
    ) THEN '✅ Esperada'
    ELSE '⚠️ Verificar'
  END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Políticas esperadas para institutions
SELECT 
  'institutions' as tabela,
  policyname,
  CASE 
    WHEN policyname IN (
      'Admins can manage institutions',
      'Institution users can view own institution'
    ) THEN '✅ Esperada'
    ELSE '⚠️ Verificar'
  END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'institutions';

-- Políticas esperadas para families
SELECT 
  'families' as tabela,
  policyname,
  CASE 
    WHEN policyname IN (
      'Admins can manage families',
      'Institution users can view associated families',
      'Institution users can update associated families'
    ) THEN '✅ Esperada'
    ELSE '⚠️ Verificar'
  END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'families';

-- Políticas esperadas para deliveries
SELECT 
  'deliveries' as tabela,
  policyname,
  CASE 
    WHEN policyname IN (
      'Admins can manage deliveries',
      'Institution users can view own deliveries',
      'Institution users can create deliveries',
      'Institution users can update own deliveries'
    ) THEN '✅ Esperada'
    ELSE '⚠️ Verificar'
  END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'deliveries';

-- Políticas esperadas para institution_families
SELECT 
  'institution_families' as tabela,
  policyname,
  CASE 
    WHEN policyname IN (
      'Admins can manage institution_families',
      'Institution users can view own associations'
    ) THEN '✅ Esperada'
    ELSE '⚠️ Verificar'
  END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'institution_families';

-- ============================================
-- 5. VERIFICAR FUNÇÕES AUXILIARES RLS
-- ============================================

SELECT 
  routine_name as function_name,
  routine_type,
  CASE 
    WHEN routine_name IN ('get_user_role', 'get_user_institution') THEN '✅ Esperada'
    ELSE '⚠️ Verificar'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_role', 'get_user_institution')
ORDER BY routine_name;

-- ============================================
-- 6. RESUMO FINAL
-- ============================================

SELECT 
  'RESUMO RLS' as verificacao,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'families', 'institutions', 'deliveries', 'institution_families') AND rowsecurity = true) as tabelas_com_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'families', 'institutions', 'deliveries', 'institution_families')) as total_politicas,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('get_user_role', 'get_user_institution')) as funcoes_auxiliares;

