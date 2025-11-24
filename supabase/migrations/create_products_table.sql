-- Migration: Criar tabela products (Produtos)
-- Data: 2025-01-XX
-- Descrição: Tabela para cadastro de produtos/alimentos que podem ser estocados e entregues

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- kg, litros, unidades, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único em name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name_unique 
ON public.products(LOWER(name));

-- Índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_products_name 
ON public.products(name);

-- Índice para produtos ativos
CREATE INDEX IF NOT EXISTS idx_products_is_active 
ON public.products(is_active) 
WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE public.products IS 'Tabela de produtos/alimentos que podem ser estocados e entregues';
COMMENT ON COLUMN public.products.name IS 'Nome do produto (único, case-insensitive)';
COMMENT ON COLUMN public.products.unit IS 'Unidade de medida (kg, litros, unidades, etc.)';
COMMENT ON COLUMN public.products.description IS 'Descrição detalhada do produto';
COMMENT ON COLUMN public.products.is_active IS 'Indica se o produto está ativo (soft delete)';

