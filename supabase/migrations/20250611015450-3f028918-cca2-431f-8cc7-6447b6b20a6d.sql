
-- Passo 5: Dados de Teste

-- Inserir algumas instituições de exemplo
INSERT INTO public.institutions (name, address, phone) VALUES
('APAE Araguari', 'Rua das Flores, 123 - Centro', '(34) 3241-1234'),
('Casa da Sopa', 'Av. Principal, 456 - Bairro Alto', '(34) 3241-5678'),
('Centro Espírita Luz e Paz', 'Rua da Esperança, 789 - Vila Nova', '(34) 3241-9012');

-- Inserir algumas famílias de exemplo
INSERT INTO public.families (name, contact_person, phone, members_count) VALUES
('Família Silva', 'Maria Silva', '(34) 99999-1111', 4),
('Família Santos', 'João Santos', '(34) 99999-2222', 3),
('Família Oliveira', 'Ana Oliveira', '(34) 99999-3333', 5),
('Família Costa', 'Pedro Costa', '(34) 99999-4444', 2),
('Família Souza', 'Carla Souza', '(34) 99999-5555', 6);

-- Associar famílias às instituições (relacionamento N-para-N)
-- APAE atende Família Silva e Santos
INSERT INTO public.institution_families (institution_id, family_id) 
SELECT 
    i.id, 
    f.id 
FROM public.institutions i, public.families f 
WHERE i.name = 'APAE Araguari' 
AND f.name IN ('Família Silva', 'Família Santos');

-- Casa da Sopa atende Família Oliveira e Costa
INSERT INTO public.institution_families (institution_id, family_id) 
SELECT 
    i.id, 
    f.id 
FROM public.institutions i, public.families f 
WHERE i.name = 'Casa da Sopa' 
AND f.name IN ('Família Oliveira', 'Família Costa');

-- Centro Espírita atende Família Souza e Silva (família pode ser atendida por múltiplas instituições)
INSERT INTO public.institution_families (institution_id, family_id) 
SELECT 
    i.id, 
    f.id 
FROM public.institutions i, public.families f 
WHERE i.name = 'Centro Espírita Luz e Paz' 
AND f.name IN ('Família Souza', 'Família Silva');

-- Inserir algumas entregas de exemplo (isso vai automaticamente bloquear as famílias)
INSERT INTO public.deliveries (family_id, institution_id, delivery_date, blocking_period_days, notes)
SELECT 
    f.id,
    i.id,
    now() - INTERVAL '10 days',
    30,
    'Entrega de cesta básica completa'
FROM public.institutions i, public.families f 
WHERE i.name = 'APAE Araguari' AND f.name = 'Família Silva';

INSERT INTO public.deliveries (family_id, institution_id, delivery_date, blocking_period_days, notes)
SELECT 
    f.id,
    i.id,
    now() - INTERVAL '5 days',
    30,
    'Cesta com produtos de higiene'
FROM public.institutions i, public.families f 
WHERE i.name = 'Casa da Sopa' AND f.name = 'Família Oliveira';
