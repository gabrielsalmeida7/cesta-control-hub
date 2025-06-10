
-- Passo 1: Criação das Tabelas Base (Ajustado)

-- Tabela para armazenar as instituições
CREATE TABLE public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    CONSTRAINT institutions_name_not_empty CHECK (length(trim(name)) > 0)
);

COMMENT ON TABLE public.institutions IS 'Armazena as informações das instituições parceiras.';

-- Criar índice para busca por nome
CREATE INDEX idx_institutions_name ON public.institutions(name);

-- Tabela para as famílias (compartilhada por todos)
CREATE TABLE public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT,
    members_count INT DEFAULT 1,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMPTZ,
    blocked_by_institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    block_reason TEXT,
    CONSTRAINT families_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT families_contact_not_empty CHECK (length(trim(contact_person)) > 0),
    CONSTRAINT families_members_positive CHECK (members_count > 0),
    CONSTRAINT families_blocked_logic CHECK (
        (is_blocked = TRUE AND blocked_until IS NOT NULL) OR 
        (is_blocked = FALSE)
    )
);

COMMENT ON TABLE public.families IS 'Tabela compartilhada de famílias. O bloqueio impede que recebam múltiplas cestas em um curto período.';

-- Criar índices para otimização
CREATE INDEX idx_families_name ON public.families(name);
CREATE INDEX idx_families_blocked ON public.families(is_blocked, blocked_until);
CREATE INDEX idx_families_blocked_by_institution ON public.families(blocked_by_institution_id);

-- Tabela para perfis de usuário (usando o enum user_role existente)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'Usuário',
    role user_role NOT NULL DEFAULT 'institution',
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    CONSTRAINT profiles_email_not_empty CHECK (length(trim(email)) > 0),
    CONSTRAINT profiles_name_not_empty CHECK (length(trim(full_name)) > 0),
    CONSTRAINT profiles_institution_logic CHECK (
        (role = 'admin' AND institution_id IS NULL) OR 
        (role = 'institution' AND institution_id IS NOT NULL)
    )
);

COMMENT ON TABLE public.profiles IS 'Armazena dados adicionais dos usuários, como sua permissão (role) e a qual instituição pertence.';

-- Criar índices para otimização
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_institution ON public.profiles(institution_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
