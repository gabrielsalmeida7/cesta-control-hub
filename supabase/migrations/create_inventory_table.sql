-- Migration: Criar tabela inventory (Estoque por Instituição)
-- Data: 2025-01-XX
-- Descrição: Tabela para controle de estoque de produtos por instituição

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_movement_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_institution_product UNIQUE (institution_id, product_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_inventory_institution_id 
ON public.inventory(institution_id);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id 
ON public.inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_last_movement_date 
ON public.inventory(last_movement_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE public.inventory IS 'Tabela de estoque de produtos por instituição';
COMMENT ON COLUMN public.inventory.quantity IS 'Quantidade atual do produto no estoque da instituição';
COMMENT ON COLUMN public.inventory.last_movement_date IS 'Data da última movimentação (entrada ou saída) deste produto';
COMMENT ON CONSTRAINT unique_institution_product ON public.inventory IS 'Garante que cada instituição tenha apenas um registro por produto';

