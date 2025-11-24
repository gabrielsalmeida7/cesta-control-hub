-- Migration: Criar tabela suppliers (Fornecedores)
-- Data: 2025-01-XX
-- Descrição: Tabela para cadastro de fornecedores (pessoa física ou jurídica)

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    document TEXT, -- CPF ou CNPJ (sem formatação)
    supplier_type TEXT NOT NULL CHECK (supplier_type IN ('PF', 'PJ')),
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único em document (apenas se document não for NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_document_unique 
ON public.suppliers(document) 
WHERE document IS NOT NULL;

-- Índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_suppliers_name 
ON public.suppliers(name);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE public.suppliers IS 'Tabela de fornecedores (pessoa física ou jurídica)';
COMMENT ON COLUMN public.suppliers.document IS 'CPF (11 dígitos) ou CNPJ (14 dígitos) sem formatação';
COMMENT ON COLUMN public.suppliers.supplier_type IS 'Tipo de fornecedor: PF (Pessoa Física) ou PJ (Pessoa Jurídica)';
COMMENT ON COLUMN public.suppliers.contact_name IS 'Nome da pessoa de contato';
COMMENT ON COLUMN public.suppliers.contact_phone IS 'Telefone de contato';
COMMENT ON COLUMN public.suppliers.contact_email IS 'Email de contato';
COMMENT ON COLUMN public.suppliers.address IS 'Endereço completo do fornecedor';
COMMENT ON COLUMN public.suppliers.notes IS 'Observações adicionais sobre o fornecedor';

