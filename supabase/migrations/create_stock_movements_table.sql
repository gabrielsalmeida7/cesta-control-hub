-- Migration: Criar tabela stock_movements (Movimentações de Estoque)
-- Data: 2025-01-XX
-- Descrição: Tabela para registro de todas as movimentações de estoque (entradas e saídas)

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('ENTRADA', 'SAIDA')),
    quantity DECIMAL(10,2) NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL, -- Apenas para ENTRADA
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL, -- Apenas para SAIDA
    movement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_institution_id 
ON public.stock_movements(institution_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id 
ON public.stock_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_date 
ON public.stock_movements(movement_date);

CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type 
ON public.stock_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_stock_movements_supplier_id 
ON public.stock_movements(supplier_id) 
WHERE supplier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_delivery_id 
ON public.stock_movements(delivery_id) 
WHERE delivery_id IS NOT NULL;

-- Comentários nas colunas
COMMENT ON TABLE public.stock_movements IS 'Tabela de movimentações de estoque (entradas e saídas)';
COMMENT ON COLUMN public.stock_movements.movement_type IS 'Tipo de movimentação: ENTRADA ou SAIDA';
COMMENT ON COLUMN public.stock_movements.quantity IS 'Quantidade movimentada (sempre positiva)';
COMMENT ON COLUMN public.stock_movements.supplier_id IS 'Fornecedor (apenas para movimentações de ENTRADA)';
COMMENT ON COLUMN public.stock_movements.delivery_id IS 'Entrega relacionada (apenas para movimentações de SAIDA)';
COMMENT ON COLUMN public.stock_movements.movement_date IS 'Data e hora da movimentação';
COMMENT ON COLUMN public.stock_movements.notes IS 'Observações sobre a movimentação';
COMMENT ON COLUMN public.stock_movements.created_by_user_id IS 'Usuário que criou a movimentação';

