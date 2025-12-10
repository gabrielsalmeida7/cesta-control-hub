-- Migration: Adicionar políticas INSERT e melhorar SELECT para families
-- Data: 2025-01-XX
-- Descrição: Permite que usuários de instituição busquem e criem famílias

-- ============================================
-- 1. ADICIONAR POLÍTICA INSERT PARA families
-- ============================================
-- Usuários de instituição podem criar novas famílias

CREATE POLICY "families_insert_policy" ON public.families
  FOR INSERT WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (select public.get_user_role((select auth.uid()))) = 'institution'
  );

COMMENT ON POLICY "families_insert_policy" ON public.families IS 
'Permite que admins e usuários de instituição possam criar novas famílias.';

-- ============================================
-- 2. ADICIONAR POLÍTICA SELECT PARA BUSCA
-- ============================================
-- Permitir que usuários de instituição busquem famílias por CPF/nome
-- mesmo que não estejam vinculadas (para poder adicionar famílias existentes)

-- Nota: Esta política permite SELECT em qualquer família para usuários de instituição
-- A aplicação já filtra os resultados e só permite vincular após busca bem-sucedida
CREATE POLICY "families_select_search_policy" ON public.families
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (select public.get_user_role((select auth.uid()))) = 'institution'
  );

COMMENT ON POLICY "families_select_search_policy" ON public.families IS 
'Permite que admins e usuários de instituição busquem famílias por CPF/nome para adicionar famílias existentes. Complementa a política families_select_policy que já permite ver famílias vinculadas.';
