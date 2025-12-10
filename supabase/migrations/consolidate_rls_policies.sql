-- Migration: Consolidar Políticas RLS Múltiplas
-- Data: 2025-01-XX
-- Descrição: Consolida múltiplas políticas permissivas em políticas únicas usando OR para melhor performance
-- 
-- Problema: Múltiplas políticas permissivas para o mesmo role e ação causam avaliação redundante
-- Solução: Consolidar políticas usando OR em uma única política por operação
--
-- IMPORTANTE: Esta migration deve ser executada APÓS optimize_rls_policies_performance.sql
-- pois assume que as políticas já estão otimizadas com subselects

-- ============================================
-- 1. CONSOLIDAR POLÍTICAS PARA profiles (SELECT)
-- ============================================
-- Consolidar: "Admins can view all profiles" + "Users can view own profile"

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (select auth.uid()) = id
  );

-- Manter política de UPDATE separada (não há múltiplas políticas)
-- "Users can update own profile" já existe e está otimizada

-- ============================================
-- 2. CONSOLIDAR POLÍTICAS PARA institutions (SELECT)
-- ============================================
-- Consolidar: "Admins can manage institutions" + "Institution users can view own institution"

DROP POLICY IF EXISTS "Admins can manage institutions" ON public.institutions;
DROP POLICY IF EXISTS "Institution users can view own institution" ON public.institutions;

-- Para FOR ALL, criar políticas separadas por operação
CREATE POLICY "institutions_select_policy" ON public.institutions
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "institutions_modify_policy" ON public.institutions
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin')
  WITH CHECK ((select public.get_user_role((select auth.uid()))) = 'admin');

-- ============================================
-- 3. CONSOLIDAR POLÍTICAS PARA families (SELECT, UPDATE)
-- ============================================
-- Consolidar SELECT: "Admins can manage families" + "Institution users can view associated families"
-- Consolidar UPDATE: "Admins can manage families" + "Institution users can update associated families"

DROP POLICY IF EXISTS "Admins can manage families" ON public.families;
DROP POLICY IF EXISTS "Institution users can view associated families" ON public.families;
DROP POLICY IF EXISTS "Institution users can update associated families" ON public.families;

CREATE POLICY "families_select_policy" ON public.families
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND EXISTS (
        SELECT 1 FROM public.institution_families 
        WHERE family_id = id 
        AND institution_id = (select public.get_user_institution((select auth.uid())))
      )
    )
  );

CREATE POLICY "families_update_policy" ON public.families
  FOR UPDATE USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND EXISTS (
        SELECT 1 FROM public.institution_families 
        WHERE family_id = id 
        AND institution_id = (select public.get_user_institution((select auth.uid())))
      )
    )
  );

CREATE POLICY "families_modify_policy" ON public.families
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin')
  WITH CHECK ((select public.get_user_role((select auth.uid()))) = 'admin');

-- ============================================
-- 4. CONSOLIDAR POLÍTICAS PARA institution_families (SELECT, INSERT)
-- ============================================
-- Consolidar SELECT: "Admins can manage institution_families" + "Institution users can view own associations"
-- Consolidar INSERT: "Admins can manage institution_families" + "Institution users can create own associations"

DROP POLICY IF EXISTS "Admins can manage institution_families" ON public.institution_families;
DROP POLICY IF EXISTS "Institution users can view own associations" ON public.institution_families;
DROP POLICY IF EXISTS "Institution users can create own associations" ON public.institution_families;

CREATE POLICY "institution_families_select_policy" ON public.institution_families
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "institution_families_insert_policy" ON public.institution_families
  FOR INSERT WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "institution_families_modify_policy" ON public.institution_families
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin')
  WITH CHECK ((select public.get_user_role((select auth.uid()))) = 'admin');

-- ============================================
-- 5. CONSOLIDAR POLÍTICAS PARA deliveries (SELECT, INSERT, UPDATE)
-- ============================================
-- Consolidar SELECT: "Admins can manage deliveries" + "Institution users can view own deliveries"
-- Consolidar INSERT: "Admins can manage deliveries" + "Institution users can create deliveries"
-- Consolidar UPDATE: "Admins can manage deliveries" + "Institution users can update own deliveries"

DROP POLICY IF EXISTS "Admins can manage deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Institution users can view own deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Institution users can create deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Institution users can update own deliveries" ON public.deliveries;

CREATE POLICY "deliveries_select_policy" ON public.deliveries
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "deliveries_insert_policy" ON public.deliveries
  FOR INSERT WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "deliveries_update_policy" ON public.deliveries
  FOR UPDATE USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "deliveries_modify_policy" ON public.deliveries
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin')
  WITH CHECK ((select public.get_user_role((select auth.uid()))) = 'admin');

-- ============================================
-- 6. CONSOLIDAR POLÍTICAS PARA stock_movements (SELECT, INSERT, UPDATE)
-- ============================================

DROP POLICY IF EXISTS "Admins can manage stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Institution users can view own stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Institution users can create own stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Institution users can update own stock_movements" ON public.stock_movements;

CREATE POLICY "stock_movements_select_policy" ON public.stock_movements
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "stock_movements_insert_policy" ON public.stock_movements
  FOR INSERT WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "stock_movements_update_policy" ON public.stock_movements
  FOR UPDATE USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "stock_movements_modify_policy" ON public.stock_movements
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin')
  WITH CHECK ((select public.get_user_role((select auth.uid()))) = 'admin');

-- ============================================
-- 7. CONSOLIDAR POLÍTICAS PARA suppliers (SELECT)
-- ============================================

DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Institution users can view suppliers" ON public.suppliers;

CREATE POLICY "suppliers_select_policy" ON public.suppliers
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (select public.get_user_role((select auth.uid()))) = 'institution'
  );

CREATE POLICY "suppliers_modify_policy" ON public.suppliers
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin')
  WITH CHECK ((select public.get_user_role((select auth.uid()))) = 'admin');

-- ============================================
-- 8. CONSOLIDAR POLÍTICAS PARA products (SELECT)
-- ============================================

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (select auth.role()) = 'authenticated'
  );

CREATE POLICY "products_modify_policy" ON public.products
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin')
  WITH CHECK ((select public.get_user_role((select auth.uid()))) = 'admin');

-- ============================================
-- 9. CONSOLIDAR POLÍTICAS PARA inventory (SELECT, INSERT, UPDATE, DELETE)
-- ============================================
-- Consolidar: "Admins can manage inventory" + "Institution users can view own inventory" + "Institution users can manage own inventory"

DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Institution users can view own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Institution users can manage own inventory" ON public.inventory;

CREATE POLICY "inventory_select_policy" ON public.inventory
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "inventory_modify_policy" ON public.inventory
  FOR ALL USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  )
  WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

-- ============================================
-- 10. CONSOLIDAR POLÍTICAS PARA receipts (SELECT, INSERT)
-- ============================================

DROP POLICY IF EXISTS "Admins can manage receipts" ON public.receipts;
DROP POLICY IF EXISTS "Institution users can view own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Institution users can create own receipts" ON public.receipts;

CREATE POLICY "receipts_select_policy" ON public.receipts
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "receipts_insert_policy" ON public.receipts
  FOR INSERT WITH CHECK (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );

CREATE POLICY "receipts_modify_policy" ON public.receipts
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin')
  WITH CHECK ((select public.get_user_role((select auth.uid()))) = 'admin');

-- ============================================
-- 11. CONSOLIDAR POLÍTICAS PARA consent_change_log (SELECT)
-- ============================================

DROP POLICY IF EXISTS "Admins can view all consent_change_log" ON public.consent_change_log;
DROP POLICY IF EXISTS "Institution users can view related consent_change_log" ON public.consent_change_log;

CREATE POLICY "consent_change_log_select_policy" ON public.consent_change_log
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND EXISTS (
        SELECT 1 FROM public.institution_families 
        WHERE family_id = consent_change_log.family_id 
        AND institution_id = (select public.get_user_institution((select auth.uid())))
      )
    )
  );

-- ============================================
-- 12. CONSOLIDAR POLÍTICAS PARA audit_logs (SELECT)
-- ============================================

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR user_id = (select auth.uid())
  );

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON POLICY "profiles_select_policy" ON public.profiles IS 
'Política consolidada para SELECT em profiles. Admin vê todos, usuários veem próprio perfil.';

COMMENT ON POLICY "deliveries_select_policy" ON public.deliveries IS 
'Política consolidada para SELECT em deliveries. Admin vê todas, instituição vê próprias.';

COMMENT ON POLICY "audit_logs_select_policy" ON public.audit_logs IS 
'Política consolidada para SELECT em audit_logs. Admin vê todos, usuários veem próprios logs.';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- Esta migration consolida múltiplas políticas permissivas em políticas únicas usando OR.
-- Isso reduz o número de políticas avaliadas por query, melhorando a performance.
--
-- Estratégia:
-- - Para operações com múltiplas políticas (SELECT, INSERT, UPDATE), consolidar usando OR
-- - Manter políticas separadas quando faz sentido (ex: SELECT vs INSERT)
-- - Admin sempre tem acesso total, então usar OR com condições específicas para instituição
--
-- Benefícios:
-- - Menos políticas para avaliar por query
-- - Melhor performance em queries complexas
-- - Políticas mais fáceis de entender e manter
--
-- Para verificar políticas consolidadas:
-- SELECT schemaname, tablename, policyname, cmd, COUNT(*) OVER (PARTITION BY tablename, cmd) as policies_count
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, cmd, policyname;

