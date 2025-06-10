
-- Passo 2: Tabelas de Relacionamento

-- Tabela de junção para o relacionamento N-para-N entre Instituições e Famílias
CREATE TABLE public.institution_families (
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (institution_id, family_id)
);

COMMENT ON TABLE public.institution_families IS 'Associa quais instituições atendem quais famílias.';

-- Criar índices para otimização de consultas
CREATE INDEX idx_institution_families_institution ON public.institution_families(institution_id);
CREATE INDEX idx_institution_families_family ON public.institution_families(family_id);

-- Tabela para registrar as entregas de cestas
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    delivery_date TIMESTAMPTZ DEFAULT now(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE RESTRICT,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
    blocking_period_days INT NOT NULL DEFAULT 30,
    notes TEXT,
    delivered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT deliveries_blocking_period_positive CHECK (blocking_period_days > 0)
);

COMMENT ON TABLE public.deliveries IS 'Registra cada entrega de cesta, vinculando uma instituição a uma família.';

-- Criar índices para otimização
CREATE INDEX idx_deliveries_family ON public.deliveries(family_id);
CREATE INDEX idx_deliveries_institution ON public.deliveries(institution_id);
CREATE INDEX idx_deliveries_date ON public.deliveries(delivery_date);
CREATE INDEX idx_deliveries_user ON public.deliveries(delivered_by_user_id);
