-- Migration: Otimizar Políticas RLS para Performance
-- Data: 2025-01-XX
-- Descrição: Otimiza políticas RLS usando subselects para evitar reavaliação de auth.uid() e funções para cada linha
-- 
-- Problema: Políticas RLS estão reavaliando auth.uid() e funções auth.*() para cada linha
-- Solução: Usar (select auth.uid()) e (select get_user_role((select auth.uid()))) para avaliar apenas uma vez por query
--
-- Referência: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- 1. OTIMIZAR POLÍTICAS PARA profiles
-- ============================================

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recriar políticas otimizadas
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING ((select public.get_user_role((select auth.uid()))) = 'admin');

-- ============================================
-- 2. OTIMIZAR POLÍTICAS PARA institutions
-- ============================================

DROP POLICY IF EXISTS "Admins can manage institutions" ON public.institutions;
DROP POLICY IF EXISTS "Institution users can view own institution" ON public.institutions;

CREATE POLICY "Admins can manage institutions" ON public.institutions
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view own institution" ON public.institutions
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND id = (select public.get_user_institution((select auth.uid())))
  );

-- ============================================
-- 3. OTIMIZAR POLÍTICAS PARA families
-- ============================================

DROP POLICY IF EXISTS "Admins can manage families" ON public.families;
DROP POLICY IF EXISTS "Institution users can view associated families" ON public.families;
DROP POLICY IF EXISTS "Institution users can update associated families" ON public.families;

CREATE POLICY "Admins can manage families" ON public.families
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view associated families" ON public.families
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND EXISTS (
      SELECT 1 FROM public.institution_families 
      WHERE family_id = id 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "Institution users can update associated families" ON public.families
  FOR UPDATE USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND EXISTS (
      SELECT 1 FROM public.institution_families 
      WHERE family_id = id 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

-- ============================================
-- 4. OTIMIZAR POLÍTICAS PARA institution_families
-- ============================================

DROP POLICY IF EXISTS "Admins can manage institution_families" ON public.institution_families;
DROP POLICY IF EXISTS "Institution users can view own associations" ON public.institution_families;
DROP POLICY IF EXISTS "Institution users can create own associations" ON public.institution_families;

CREATE POLICY "Admins can manage institution_families" ON public.institution_families
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view own associations" ON public.institution_families
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

CREATE POLICY "Institution users can create own associations" ON public.institution_families
  FOR INSERT WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

-- ============================================
-- 5. OTIMIZAR POLÍTICAS PARA deliveries
-- ============================================

DROP POLICY IF EXISTS "Admins can manage deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Institution users can view own deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Institution users can create deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Institution users can update own deliveries" ON public.deliveries;

CREATE POLICY "Admins can manage deliveries" ON public.deliveries
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view own deliveries" ON public.deliveries
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

CREATE POLICY "Institution users can create deliveries" ON public.deliveries
  FOR INSERT WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

CREATE POLICY "Institution users can update own deliveries" ON public.deliveries
  FOR UPDATE USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

-- ============================================
-- 6. OTIMIZAR POLÍTICAS PARA stock_movements
-- ============================================

DROP POLICY IF EXISTS "Admins can manage stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Institution users can view own stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Institution users can create own stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Institution users can update own stock_movements" ON public.stock_movements;

CREATE POLICY "Admins can manage stock_movements" ON public.stock_movements
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view own stock_movements" ON public.stock_movements
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

CREATE POLICY "Institution users can create own stock_movements" ON public.stock_movements
  FOR INSERT WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

CREATE POLICY "Institution users can update own stock_movements" ON public.stock_movements
  FOR UPDATE USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

-- ============================================
-- 7. OTIMIZAR POLÍTICAS PARA suppliers
-- ============================================

DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Institution users can view suppliers" ON public.suppliers;

CREATE POLICY "Admins can manage suppliers" ON public.suppliers
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view suppliers" ON public.suppliers
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution'
  );

-- ============================================
-- 8. OTIMIZAR POLÍTICAS PARA products
-- ============================================

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

-- Para auth.role(), também usar subselect
CREATE POLICY "Authenticated users can view products" ON public.products
  FOR SELECT USING ((select auth.role()) = 'authenticated');

-- ============================================
-- 9. OTIMIZAR POLÍTICAS PARA inventory
-- ============================================

DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Institution users can view own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Institution users can manage own inventory" ON public.inventory;

CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view own inventory" ON public.inventory
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

CREATE POLICY "Institution users can manage own inventory" ON public.inventory
  FOR ALL USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  )
  WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

-- ============================================
-- 10. OTIMIZAR POLÍTICAS PARA receipts
-- ============================================

DROP POLICY IF EXISTS "Admins can manage receipts" ON public.receipts;
DROP POLICY IF EXISTS "Institution users can view own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Institution users can create own receipts" ON public.receipts;

CREATE POLICY "Admins can manage receipts" ON public.receipts
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view own receipts" ON public.receipts
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

CREATE POLICY "Institution users can create own receipts" ON public.receipts
  FOR INSERT WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );

-- ============================================
-- 11. OTIMIZAR POLÍTICAS PARA consent_change_log
-- ============================================

DROP POLICY IF EXISTS "Admins can view all consent_change_log" ON public.consent_change_log;
DROP POLICY IF EXISTS "Institution users can view related consent_change_log" ON public.consent_change_log;

CREATE POLICY "Admins can view all consent_change_log" ON public.consent_change_log
  FOR SELECT USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view related consent_change_log" ON public.consent_change_log
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND EXISTS (
      SELECT 1 FROM public.institution_families 
      WHERE family_id = consent_change_log.family_id 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

-- ============================================
-- 12. OTIMIZAR POLÍTICAS PARA audit_logs
-- ============================================

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = (select auth.uid()));

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
'Usuários podem visualizar seu próprio perfil. Otimizado com subselect para melhor performance.';

COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 
'Administradores podem visualizar todos os perfis. Otimizado com subselect para melhor performance.';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- Esta migration otimiza todas as políticas RLS usando subselects para evitar
-- reavaliação de auth.uid() e funções para cada linha processada.
--
-- Benefícios:
-- - auth.uid() é avaliado apenas uma vez por query, não para cada linha
-- - get_user_role() e get_user_institution() são avaliados apenas uma vez
-- - Melhoria significativa de performance em queries com muitas linhas
--
-- Para verificar se as políticas foram otimizadas:
-- SELECT schemaname, tablename, policyname, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND qual LIKE '%select auth.uid()%' OR qual LIKE '%select get_user_role%'
-- ORDER BY tablename, policyname;

