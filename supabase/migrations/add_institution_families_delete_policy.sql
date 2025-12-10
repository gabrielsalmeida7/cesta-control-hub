-- Migration: Adicionar política DELETE para institution_families
-- Data: 2025-01-XX
-- Descrição: Permite que usuários de instituição possam desvincular famílias de sua instituição

-- ============================================
-- ADICIONAR POLÍTICA DELETE PARA institution_families
-- ============================================
-- Usuários de instituição podem deletar apenas vínculos de sua própria instituição

CREATE POLICY "institution_families_delete_policy" ON public.institution_families
  FOR DELETE USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

COMMENT ON POLICY "institution_families_delete_policy" ON public.institution_families IS 
'Permite que admins e usuários de instituição possam deletar vínculos. Usuários de instituição só podem deletar vínculos de sua própria instituição.';
