-- Migration: Habilitar RLS e Criar Políticas para Todas as Tabelas Públicas
-- Data: 2025-01-XX
-- Descrição: Habilita Row Level Security (RLS) em todas as tabelas públicas e cria políticas adequadas
-- 
-- Tabelas afetadas:
-- - institution_families (verificar se já tem RLS)
-- - profiles (verificar se já tem RLS)
-- - institutions (verificar se já tem RLS)
-- - stock_movements (NOVO)
-- - suppliers (NOVO)
-- - products (NOVO)
-- - inventory (NOVO)
-- - deliveries (verificar se já tem RLS)
-- - receipts (NOVO)
-- - consent_change_log (NOVO)
-- - families (verificar se já tem RLS)

-- ============================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================
-- Habilitar RLS em todas as tabelas públicas
-- Se RLS já estiver habilitado, o comando será ignorado silenciosamente
-- (PostgreSQL não permite verificar facilmente, então habilitamos sempre)

-- Tabelas que podem já ter RLS habilitado (mas garantimos que está habilitado)
ALTER TABLE public.institution_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Tabelas novas que definitivamente não têm RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_change_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLÍTICAS PARA institution_families
-- ============================================
-- Verificar se políticas já existem antes de criar

-- Admin pode gerenciar todas as associações
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'institution_families' 
    AND policyname = 'Admins can manage institution_families'
  ) THEN
    CREATE POLICY "Admins can manage institution_families" ON public.institution_families
      FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
  END IF;
END $$;

-- Instituição pode ver suas próprias associações
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'institution_families' 
    AND policyname = 'Institution users can view own associations'
  ) THEN
    CREATE POLICY "Institution users can view own associations" ON public.institution_families
      FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND institution_id = public.get_user_institution(auth.uid())
      );
  END IF;
END $$;

-- Instituição pode criar associações para si mesma
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'institution_families' 
    AND policyname = 'Institution users can create own associations'
  ) THEN
    CREATE POLICY "Institution users can create own associations" ON public.institution_families
      FOR INSERT WITH CHECK (
        public.get_user_role(auth.uid()) = 'institution' 
        AND institution_id = public.get_user_institution(auth.uid())
      );
  END IF;
END $$;

-- ============================================
-- 3. POLÍTICAS PARA profiles
-- ============================================
-- Verificar e criar políticas se não existirem

-- Usuário pode ver próprio perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

-- Usuário pode atualizar próprio perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Admin pode ver todos os perfis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles" ON public.profiles
      FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
  END IF;
END $$;

-- ============================================
-- 4. POLÍTICAS PARA institutions
-- ============================================

-- Admin pode gerenciar todas as instituições
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'institutions' 
    AND policyname = 'Admins can manage institutions'
  ) THEN
    CREATE POLICY "Admins can manage institutions" ON public.institutions
      FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
  END IF;
END $$;

-- Instituição pode ver própria instituição
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'institutions' 
    AND policyname = 'Institution users can view own institution'
  ) THEN
    CREATE POLICY "Institution users can view own institution" ON public.institutions
      FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND id = public.get_user_institution(auth.uid())
      );
  END IF;
END $$;

-- ============================================
-- 5. POLÍTICAS PARA families
-- ============================================

-- Admin pode gerenciar todas as famílias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'families' 
    AND policyname = 'Admins can manage families'
  ) THEN
    CREATE POLICY "Admins can manage families" ON public.families
      FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
  END IF;
END $$;

-- Instituição pode ver famílias associadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'families' 
    AND policyname = 'Institution users can view associated families'
  ) THEN
    CREATE POLICY "Institution users can view associated families" ON public.families
      FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND EXISTS (
          SELECT 1 FROM public.institution_families 
          WHERE family_id = id 
          AND institution_id = public.get_user_institution(auth.uid())
        )
      );
  END IF;
END $$;

-- Instituição pode atualizar famílias associadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'families' 
    AND policyname = 'Institution users can update associated families'
  ) THEN
    CREATE POLICY "Institution users can update associated families" ON public.families
      FOR UPDATE USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND EXISTS (
          SELECT 1 FROM public.institution_families 
          WHERE family_id = id 
          AND institution_id = public.get_user_institution(auth.uid())
        )
      );
  END IF;
END $$;

-- ============================================
-- 6. POLÍTICAS PARA deliveries
-- ============================================

-- Admin pode gerenciar todas as entregas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deliveries' 
    AND policyname = 'Admins can manage deliveries'
  ) THEN
    CREATE POLICY "Admins can manage deliveries" ON public.deliveries
      FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
  END IF;
END $$;

-- Instituição pode ver próprias entregas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deliveries' 
    AND policyname = 'Institution users can view own deliveries'
  ) THEN
    CREATE POLICY "Institution users can view own deliveries" ON public.deliveries
      FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND institution_id = public.get_user_institution(auth.uid())
      );
  END IF;
END $$;

-- Instituição pode criar entregas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deliveries' 
    AND policyname = 'Institution users can create deliveries'
  ) THEN
    CREATE POLICY "Institution users can create deliveries" ON public.deliveries
      FOR INSERT WITH CHECK (
        public.get_user_role(auth.uid()) = 'institution' 
        AND institution_id = public.get_user_institution(auth.uid())
      );
  END IF;
END $$;

-- Instituição pode atualizar próprias entregas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'deliveries' 
    AND policyname = 'Institution users can update own deliveries'
  ) THEN
    CREATE POLICY "Institution users can update own deliveries" ON public.deliveries
      FOR UPDATE USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND institution_id = public.get_user_institution(auth.uid())
      );
  END IF;
END $$;

-- ============================================
-- 7. POLÍTICAS PARA stock_movements
-- ============================================

-- Admin pode gerenciar todas as movimentações
CREATE POLICY "Admins can manage stock_movements" ON public.stock_movements
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Instituição pode ver próprias movimentações
CREATE POLICY "Institution users can view own stock_movements" ON public.stock_movements
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'institution' 
    AND institution_id = public.get_user_institution(auth.uid())
  );

-- Instituição pode criar movimentações para si mesma
CREATE POLICY "Institution users can create own stock_movements" ON public.stock_movements
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'institution' 
    AND institution_id = public.get_user_institution(auth.uid())
  );

-- Instituição pode atualizar próprias movimentações
CREATE POLICY "Institution users can update own stock_movements" ON public.stock_movements
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'institution' 
    AND institution_id = public.get_user_institution(auth.uid())
  );

-- ============================================
-- 8. POLÍTICAS PARA suppliers
-- ============================================

-- Admin pode gerenciar todos os fornecedores
CREATE POLICY "Admins can manage suppliers" ON public.suppliers
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Instituições podem ver todos os fornecedores (para seleção em movimentações)
CREATE POLICY "Institution users can view suppliers" ON public.suppliers
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'institution'
  );

-- ============================================
-- 9. POLÍTICAS PARA products
-- ============================================

-- Admin pode gerenciar todos os produtos
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Todos os usuários autenticados podem ver produtos (para seleção em estoque/entregas)
CREATE POLICY "Authenticated users can view products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 10. POLÍTICAS PARA inventory
-- ============================================

-- Admin pode gerenciar todo o estoque
CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Instituição pode ver próprio estoque
CREATE POLICY "Institution users can view own inventory" ON public.inventory
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'institution' 
    AND institution_id = public.get_user_institution(auth.uid())
  );

-- Instituição pode criar/atualizar próprio estoque
CREATE POLICY "Institution users can manage own inventory" ON public.inventory
  FOR ALL USING (
    public.get_user_role(auth.uid()) = 'institution' 
    AND institution_id = public.get_user_institution(auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'institution' 
    AND institution_id = public.get_user_institution(auth.uid())
  );

-- ============================================
-- 11. POLÍTICAS PARA receipts
-- ============================================

-- Admin pode gerenciar todos os recibos
CREATE POLICY "Admins can manage receipts" ON public.receipts
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Instituição pode ver próprios recibos
CREATE POLICY "Institution users can view own receipts" ON public.receipts
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'institution' 
    AND institution_id = public.get_user_institution(auth.uid())
  );

-- Instituição pode criar recibos para si mesma
CREATE POLICY "Institution users can create own receipts" ON public.receipts
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'institution' 
    AND institution_id = public.get_user_institution(auth.uid())
  );

-- ============================================
-- 12. POLÍTICAS PARA consent_change_log
-- ============================================

-- Admin pode ver todos os logs de consentimento
CREATE POLICY "Admins can view all consent_change_log" ON public.consent_change_log
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Instituição pode ver logs relacionados às famílias que atende
CREATE POLICY "Institution users can view related consent_change_log" ON public.consent_change_log
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'institution' 
    AND EXISTS (
      SELECT 1 FROM public.institution_families 
      WHERE family_id = consent_change_log.family_id 
      AND institution_id = public.get_user_institution(auth.uid())
    )
  );

-- Apenas sistema pode inserir logs (via triggers/funções SECURITY DEFINER)
-- Não criar política de INSERT para usuários regulares

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON POLICY "Admins can manage stock_movements" ON public.stock_movements IS 
'Administradores têm acesso total a todas as movimentações de estoque.';

COMMENT ON POLICY "Institution users can view own stock_movements" ON public.stock_movements IS 
'Usuários de instituição podem visualizar apenas movimentações da sua própria instituição.';

COMMENT ON POLICY "Admins can manage suppliers" ON public.suppliers IS 
'Administradores podem gerenciar todos os fornecedores.';

COMMENT ON POLICY "Institution users can view suppliers" ON public.suppliers IS 
'Usuários de instituição podem visualizar fornecedores para seleção em movimentações de entrada.';

COMMENT ON POLICY "Admins can manage products" ON public.products IS 
'Administradores podem gerenciar todos os produtos.';

COMMENT ON POLICY "Authenticated users can view products" ON public.products IS 
'Usuários autenticados podem visualizar produtos para seleção em estoque e entregas.';

COMMENT ON POLICY "Admins can manage inventory" ON public.inventory IS 
'Administradores têm acesso total a todo o estoque.';

COMMENT ON POLICY "Institution users can view own inventory" ON public.inventory IS 
'Usuários de instituição podem visualizar apenas o estoque da sua própria instituição.';

COMMENT ON POLICY "Admins can manage receipts" ON public.receipts IS 
'Administradores podem gerenciar todos os recibos.';

COMMENT ON POLICY "Institution users can view own receipts" ON public.receipts IS 
'Usuários de instituição podem visualizar apenas recibos da sua própria instituição.';

COMMENT ON POLICY "Admins can view all consent_change_log" ON public.consent_change_log IS 
'Administradores podem visualizar todos os logs de mudanças de consentimento para compliance LGPD.';

COMMENT ON POLICY "Institution users can view related consent_change_log" ON public.consent_change_log IS 
'Usuários de instituição podem visualizar logs de consentimento apenas das famílias que atendem.';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- 
-- Para verificar se RLS está habilitado em todas as tabelas:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN (
--     'institution_families', 'profiles', 'institutions', 'families', 
--     'deliveries', 'stock_movements', 'suppliers', 'products', 
--     'inventory', 'receipts', 'consent_change_log'
--   )
-- ORDER BY tablename;
--
-- Para verificar políticas criadas:
-- SELECT schemaname, tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN (
--     'institution_families', 'profiles', 'institutions', 'families', 
--     'deliveries', 'stock_movements', 'suppliers', 'products', 
--     'inventory', 'receipts', 'consent_change_log'
--   )
-- ORDER BY tablename, policyname;

