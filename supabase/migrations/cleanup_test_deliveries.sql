-- Script para Limpar Entregas de Teste
-- Data: 2025-11-17
-- Descrição: Remove todas as entregas de teste para permitir exclusão de instituições de teste
-- 
-- ⚠️ ATENÇÃO: Este script deleta TODAS as entregas do banco de dados
-- Use apenas em ambiente de desenvolvimento/teste
-- 
-- INSTRUÇÕES:
-- 1. Execute primeiro as queries de VERIFICAÇÃO (linhas 15-35) para ver o que será deletado
-- 2. Se estiver tudo certo, execute a query de LIMPEZA (linha 40)
-- 3. Depois disso, você poderá excluir as instituições pelo frontend normalmente

-- ============================================
-- 1. VERIFICAÇÃO: Ver resumo de entregas por instituição
-- ============================================

SELECT 
  i.id,
  i.name as instituicao,
  i.email,
  COUNT(d.id) as total_entregas,
  MIN(d.delivery_date) as primeira_entrega,
  MAX(d.delivery_date) as ultima_entrega
FROM institutions i
LEFT JOIN deliveries d ON d.institution_id = i.id
GROUP BY i.id, i.name, i.email
ORDER BY total_entregas DESC, i.name;

-- ============================================
-- 2. VERIFICAÇÃO: Total geral de entregas
-- ============================================

SELECT 
  COUNT(*) as total_entregas_geral,
  COUNT(DISTINCT institution_id) as instituicoes_com_entregas,
  COUNT(DISTINCT family_id) as familias_atendidas,
  MIN(delivery_date) as primeira_entrega_geral,
  MAX(delivery_date) as ultima_entrega_geral
FROM deliveries;

-- ============================================
-- 3. VERIFICAÇÃO: Listar todas as entregas (últimas 20)
-- ============================================

SELECT 
  d.id,
  d.delivery_date,
  i.name as instituicao,
  f.name as familia,
  d.blocking_period_days,
  d.created_at
FROM deliveries d
JOIN institutions i ON i.id = d.institution_id
JOIN families f ON f.id = d.family_id
ORDER BY d.delivery_date DESC
LIMIT 20;

-- ============================================
-- 4. LIMPEZA: Deletar TODAS as entregas
-- ============================================
-- ⚠️ DESCOMENTE A LINHA ABAIXO APENAS SE TIVER CERTEZA
-- ⚠️ Esta ação NÃO PODE ser desfeita!

-- DELETE FROM deliveries;

-- ============================================
-- 5. VERIFICAÇÃO PÓS-LIMPEZA: Confirmar que não há mais entregas
-- ============================================
-- Execute esta query DEPOIS de executar o DELETE para confirmar

-- SELECT 
--   COUNT(*) as entregas_restantes,
--   CASE 
--     WHEN COUNT(*) = 0 THEN '✅ Todas as entregas foram deletadas'
--     ELSE '❌ Ainda existem entregas no banco'
--   END as status
-- FROM deliveries;

-- ============================================
-- 6. OPCIONAL: Limpar também bloqueios de famílias relacionados às entregas deletadas
-- ============================================
-- Se você quiser também limpar os bloqueios de famílias que foram bloqueadas por essas entregas,
-- descomente as linhas abaixo:

-- UPDATE families
-- SET 
--   is_blocked = FALSE,
--   blocked_until = NULL,
--   block_reason = NULL,
--   blocked_by_institution_id = NULL
-- WHERE blocked_by_institution_id IN (
--   SELECT id FROM institutions
-- );

-- ============================================
-- 7. OPCIONAL: Verificar famílias bloqueadas após limpeza
-- ============================================

-- SELECT 
--   f.id,
--   f.name,
--   f.is_blocked,
--   f.blocked_until,
--   i.name as bloqueada_por
-- FROM families f
-- LEFT JOIN institutions i ON i.id = f.blocked_by_institution_id
-- WHERE f.is_blocked = TRUE;

-- ============================================
-- RESUMO DO PROCESSO:
-- ============================================
-- 1. Execute as queries 1, 2 e 3 para verificar o que será deletado
-- 2. Se estiver tudo certo, descomente e execute a query 4 (DELETE FROM deliveries)
-- 3. Execute a query 5 para confirmar que foi deletado
-- 4. (Opcional) Execute a query 6 para limpar bloqueios de famílias
-- 5. Agora você pode excluir as instituições pelo frontend normalmente

