-- Migration: Remover Índices Duplicados
-- Data: 2025-01-XX
-- Descrição: Remove índices duplicados que causam overhead desnecessário
-- 
-- Problema: Algumas tabelas têm índices duplicados (mesma coluna, diferentes nomes)
-- Solução: Remover índices duplicados, mantendo apenas um (preferencialmente o mais descritivo)
--
-- Índices duplicados identificados:
-- - deliveries: idx_deliveries_family e idx_deliveries_family_id
-- - deliveries: idx_deliveries_institution e idx_deliveries_institution_id
-- - institution_families: idx_institution_families_family e idx_institution_families_family_id
-- - institution_families: idx_institution_families_institution e idx_institution_families_institution_id

-- ============================================
-- 1. REMOVER ÍNDICES DUPLICADOS DE deliveries
-- ============================================

-- Verificar se índices existem antes de dropar
DO $$
BEGIN
  -- Remover idx_deliveries_family (manter idx_deliveries_family_id)
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'deliveries' 
    AND indexname = 'idx_deliveries_family'
  ) THEN
    DROP INDEX IF EXISTS public.idx_deliveries_family;
    RAISE NOTICE 'Índice idx_deliveries_family removido (duplicado de idx_deliveries_family_id)';
  END IF;

  -- Remover idx_deliveries_institution (manter idx_deliveries_institution_id)
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'deliveries' 
    AND indexname = 'idx_deliveries_institution'
  ) THEN
    DROP INDEX IF EXISTS public.idx_deliveries_institution;
    RAISE NOTICE 'Índice idx_deliveries_institution removido (duplicado de idx_deliveries_institution_id)';
  END IF;
END $$;

-- ============================================
-- 2. REMOVER ÍNDICES DUPLICADOS DE institution_families
-- ============================================

DO $$
BEGIN
  -- Remover idx_institution_families_family (manter idx_institution_families_family_id)
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'institution_families' 
    AND indexname = 'idx_institution_families_family'
  ) THEN
    DROP INDEX IF EXISTS public.idx_institution_families_family;
    RAISE NOTICE 'Índice idx_institution_families_family removido (duplicado de idx_institution_families_family_id)';
  END IF;

  -- Remover idx_institution_families_institution (manter idx_institution_families_institution_id)
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'institution_families' 
    AND indexname = 'idx_institution_families_institution'
  ) THEN
    DROP INDEX IF EXISTS public.idx_institution_families_institution;
    RAISE NOTICE 'Índice idx_institution_families_institution removido (duplicado de idx_institution_families_institution_id)';
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- 
-- Para verificar se os índices foram removidos corretamente:
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('deliveries', 'institution_families')
--   AND (
--     indexname LIKE '%family%' OR indexname LIKE '%institution%'
--   )
-- ORDER BY tablename, indexname;
--
-- Deve mostrar apenas:
-- - deliveries: idx_deliveries_family_id, idx_deliveries_institution_id
-- - institution_families: idx_institution_families_family_id, idx_institution_families_institution_id

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

-- Adicionar comentários aos índices mantidos (usando DO block para verificar existência)
DO $$
BEGIN
  -- Comentário para idx_deliveries_family_id
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'deliveries' 
    AND indexname = 'idx_deliveries_family_id'
  ) THEN
    COMMENT ON INDEX public.idx_deliveries_family_id IS 
    'Índice em family_id da tabela deliveries. Índice duplicado idx_deliveries_family foi removido.';
  END IF;

  -- Comentário para idx_deliveries_institution_id
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'deliveries' 
    AND indexname = 'idx_deliveries_institution_id'
  ) THEN
    COMMENT ON INDEX public.idx_deliveries_institution_id IS 
    'Índice em institution_id da tabela deliveries. Índice duplicado idx_deliveries_institution foi removido.';
  END IF;

  -- Comentário para idx_institution_families_family_id
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'institution_families' 
    AND indexname = 'idx_institution_families_family_id'
  ) THEN
    COMMENT ON INDEX public.idx_institution_families_family_id IS 
    'Índice em family_id da tabela institution_families. Índice duplicado idx_institution_families_family foi removido.';
  END IF;

  -- Comentário para idx_institution_families_institution_id
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'institution_families' 
    AND indexname = 'idx_institution_families_institution_id'
  ) THEN
    COMMENT ON INDEX public.idx_institution_families_institution_id IS 
    'Índice em institution_id da tabela institution_families. Índice duplicado idx_institution_families_institution foi removido.';
  END IF;
END $$;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- Esta migration remove índices duplicados que causam overhead desnecessário.
-- Índices duplicados:
-- - Aumentam tempo de INSERT/UPDATE (cada índice precisa ser atualizado)
-- - Consomem espaço em disco desnecessariamente
-- - Não melhoram performance de SELECT (PostgreSQL usa apenas um)
--
-- Estratégia:
-- - Manter índices com nomes mais descritivos (com sufixo _id)
-- - Remover índices com nomes genéricos (sem sufixo)
-- - Verificar existência antes de dropar para evitar erros
--
-- Benefícios:
-- - Menos overhead em operações de escrita
-- - Menos espaço em disco
-- - Manutenção mais simples
--
-- IMPORTANTE: Esta migration é segura e reversível. Se necessário, os índices
-- podem ser recriados usando os nomes removidos.

