
-- Passo 4: Políticas de Segurança (RLS)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela profiles
-- Usuários podem ver e editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Políticas para a tabela institutions
-- Admins podem fazer tudo
CREATE POLICY "Admins can manage institutions" ON public.institutions
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Usuários de instituição podem ver apenas sua própria instituição
CREATE POLICY "Institution users can view own institution" ON public.institutions
    FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND id = public.get_user_institution(auth.uid())
    );

-- Políticas para a tabela families
-- Admins podem fazer tudo
CREATE POLICY "Admins can manage families" ON public.families
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Usuários de instituição podem ver apenas famílias associadas à sua instituição
CREATE POLICY "Institution users can view associated families" ON public.families
    FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND EXISTS (
            SELECT 1 FROM public.institution_families 
            WHERE family_id = id 
            AND institution_id = public.get_user_institution(auth.uid())
        )
    );

-- Usuários de instituição podem atualizar famílias associadas (para bloqueios)
CREATE POLICY "Institution users can update associated families" ON public.families
    FOR UPDATE USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND EXISTS (
            SELECT 1 FROM public.institution_families 
            WHERE family_id = id 
            AND institution_id = public.get_user_institution(auth.uid())
        )
    );

-- Políticas para a tabela institution_families
-- Admins podem fazer tudo
CREATE POLICY "Admins can manage institution_families" ON public.institution_families
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Usuários de instituição podem ver apenas suas associações
CREATE POLICY "Institution users can view own associations" ON public.institution_families
    FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND institution_id = public.get_user_institution(auth.uid())
    );

-- Políticas para a tabela deliveries
-- Admins podem fazer tudo
CREATE POLICY "Admins can manage deliveries" ON public.deliveries
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Usuários de instituição podem ver apenas entregas da sua instituição
CREATE POLICY "Institution users can view own deliveries" ON public.deliveries
    FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND institution_id = public.get_user_institution(auth.uid())
    );

-- Usuários de instituição podem criar entregas para sua instituição
CREATE POLICY "Institution users can create deliveries" ON public.deliveries
    FOR INSERT WITH CHECK (
        public.get_user_role(auth.uid()) = 'institution' 
        AND institution_id = public.get_user_institution(auth.uid())
    );

-- Usuários de instituição podem atualizar entregas da sua instituição
CREATE POLICY "Institution users can update own deliveries" ON public.deliveries
    FOR UPDATE USING (
        public.get_user_role(auth.uid()) = 'institution' 
        AND institution_id = public.get_user_institution(auth.uid())
    );
