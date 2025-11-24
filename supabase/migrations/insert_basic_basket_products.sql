-- Migration: Inserir produtos de cesta básica
-- Data: 2025-01-XX
-- Descrição: Insere 28 produtos comuns de cesta básica para totalizar 30 produtos no sistema

-- Inserir produtos usando ON CONFLICT para evitar duplicatas (baseado no nome único)
INSERT INTO public.products (name, unit, description, is_active)
VALUES
  ('Arroz', 'kg', 'Arroz branco tipo 1', true),
  ('Feijão', 'kg', 'Feijão carioca', true),
  ('Açúcar', 'kg', 'Açúcar cristal refinado', true),
  ('Óleo de Soja', 'litros', 'Óleo de soja refinado', true),
  ('Macarrão', 'kg', 'Macarrão espaguete', true),
  ('Farinha de Trigo', 'kg', 'Farinha de trigo branca', true),
  ('Leite em Pó', 'kg', 'Leite em pó integral', true),
  ('Café', 'kg', 'Café torrado e moído', true),
  ('Sal', 'kg', 'Sal refinado', true),
  ('Fubá', 'kg', 'Fubá de milho', true),
  ('Farinha de Mandioca', 'kg', 'Farinha de mandioca', true),
  ('Açúcar Cristal', 'kg', 'Açúcar cristal', true),
  ('Óleo de Girassol', 'litros', 'Óleo de girassol', true),
  ('Massa para Bolo', 'unidades', 'Massa para bolo pronta', true),
  ('Achocolatado', 'kg', 'Achocolatado em pó', true),
  ('Biscoito Doce', 'kg', 'Biscoito doce', true),
  ('Biscoito Salgado', 'kg', 'Biscoito salgado', true),
  ('Margarina', 'kg', 'Margarina', true),
  ('Manteiga', 'kg', 'Manteiga', true),
  ('Queijo Ralado', 'kg', 'Queijo ralado', true),
  ('Molho de Tomate', 'unidades', 'Molho de tomate enlatado', true),
  ('Extrato de Tomate', 'unidades', 'Extrato de tomate', true),
  ('Ervilha em Conserva', 'unidades', 'Ervilha em conserva', true),
  ('Milho em Conserva', 'unidades', 'Milho em conserva', true),
  ('Sardinha em Lata', 'unidades', 'Sardinha em lata', true),
  ('Atum em Lata', 'unidades', 'Atum em lata', true),
  ('Sabão em Pó', 'kg', 'Sabão em pó para roupas', true),
  ('Detergente', 'litros', 'Detergente líquido', true)
ON CONFLICT (LOWER(name)) DO NOTHING;

-- Comentário de documentação
COMMENT ON TABLE public.products IS 
'Produtos de cesta básica disponíveis para estoque e entrega. Total de 30 produtos incluindo os 2 já existentes.';

