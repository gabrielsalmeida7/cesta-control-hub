-- Inserir 2 novas instituições
INSERT INTO public.institutions (name, address, phone) VALUES
('Centro Social São Vicente', 'Rua das Flores, 456 - Centro', '(11) 3456-7890'),
('Associação Comunitária Esperança', 'Av. Brasil, 789 - Vila Nova', '(11) 9876-5432');

-- Inserir 5 novas famílias
INSERT INTO public.families (name, contact_person, phone, members_count, is_blocked, blocked_until, block_reason) VALUES
('Família Santos', 'Maria Santos', '(11) 98765-4321', 4, false, NULL, NULL),
('Família Oliveira', 'João Oliveira', '(11) 87654-3210', 3, false, NULL, NULL),
('Família Costa', 'Ana Costa', '(11) 76543-2109', 5, true, TIMESTAMP '2025-01-20 00:00:00', 'Recebeu cesta básica'),
('Família Pereira', 'Carlos Pereira', '(11) 65432-1098', 2, true, TIMESTAMP '2025-01-10 00:00:00', 'Recebeu cesta básica'),
('Família Lima', 'Rosa Lima', '(11) 54321-0987', 6, false, NULL, NULL);

-- Associar famílias com instituições (algumas famílias associadas a múltiplas instituições)
INSERT INTO public.institution_families (institution_id, family_id)
SELECT i.id, f.id FROM public.institutions i, public.families f
WHERE i.name = 'Instituto Esperança' AND f.name = 'Família Silva'
UNION ALL
SELECT i.id, f.id FROM public.institutions i, public.families f
WHERE i.name = 'Centro Comunitário Unidos' AND f.name = 'Família Silva'
UNION ALL
SELECT i.id, f.id FROM public.institutions i, public.families f
WHERE i.name = 'Centro Social São Vicente' AND f.name = 'Família Silva'
UNION ALL
SELECT i.id, f.id FROM public.institutions i, public.families f
WHERE i.name = 'Centro Social São Vicente' AND f.name = 'Família Santos'
UNION ALL
SELECT i.id, f.id FROM public.institutions i, public.families f
WHERE i.name = 'Associação Comunitária Esperança' AND f.name = 'Família Santos'
UNION ALL
SELECT i.id, f.id FROM public.institutions i, public.families f
WHERE i.name = 'Associação Comunitária Esperança' AND f.name = 'Família Oliveira'
UNION ALL
SELECT i.id, f.id FROM public.institutions i, public.families f
WHERE i.name = 'Centro Social São Vicente' AND f.name = 'Família Costa'
UNION ALL
SELECT i.id, f.id FROM public.institutions i, public.families f
WHERE i.name = 'Instituto Esperança' AND f.name = 'Família Pereira'
UNION ALL
SELECT i.id, f.id FROM public.institutions i, public.families f
WHERE i.name = 'Centro Comunitário Unidos' AND f.name = 'Família Lima';

-- Inserir entregas estratégicas para gerar alertas
-- Entregas da Família Silva em múltiplas instituições (alerta de fraude)
INSERT INTO public.deliveries (family_id, institution_id, delivery_date, blocking_period_days, notes)
SELECT f.id, i.id, TIMESTAMP '2025-01-05 10:00:00', 30, 'Entrega regular - cesta básica completa'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Silva' AND i.name = 'Instituto Esperança'
UNION ALL
SELECT f.id, i.id, TIMESTAMP '2025-01-08 14:00:00', 30, 'Entrega emergencial'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Silva' AND i.name = 'Centro Comunitário Unidos'
UNION ALL
SELECT f.id, i.id, TIMESTAMP '2025-01-12 09:00:00', 30, 'Entrega regular'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Silva' AND i.name = 'Centro Social São Vicente';

-- Entregas da Família Santos em múltiplas instituições
INSERT INTO public.deliveries (family_id, institution_id, delivery_date, blocking_period_days, notes)
SELECT f.id, i.id, TIMESTAMP '2025-01-10 11:00:00', 30, 'Entrega mensal'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Santos' AND i.name = 'Centro Social São Vicente'
UNION ALL
SELECT f.id, i.id, TIMESTAMP '2025-01-15 16:00:00', 30, 'Entrega especial - festa junina'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Santos' AND i.name = 'Associação Comunitária Esperança';

-- Entregas antigas para famílias com bloqueio expirado
INSERT INTO public.deliveries (family_id, institution_id, delivery_date, blocking_period_days, notes)
SELECT f.id, i.id, TIMESTAMP '2024-12-15 10:00:00', 30, 'Entrega de dezembro'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Pereira' AND i.name = 'Instituto Esperança'
UNION ALL
SELECT f.id, i.id, TIMESTAMP '2024-12-20 15:00:00', 30, 'Entrega natalina'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Costa' AND i.name = 'Centro Social São Vicente';

-- Entregas recentes normais
INSERT INTO public.deliveries (family_id, institution_id, delivery_date, blocking_period_days, notes)
SELECT f.id, i.id, TIMESTAMP '2025-01-14 10:00:00', 30, 'Entrega regular'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Oliveira' AND i.name = 'Associação Comunitária Esperança'
UNION ALL
SELECT f.id, i.id, TIMESTAMP '2025-01-11 14:00:00', 30, 'Entrega mensal'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Lima' AND i.name = 'Centro Comunitário Unidos';

-- Múltiplas entregas da Associação Comunitária Esperança (alta atividade)
INSERT INTO public.deliveries (family_id, institution_id, delivery_date, blocking_period_days, notes)
SELECT f.id, i.id, TIMESTAMP '2025-01-13 09:00:00', 15, 'Entrega express'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Silva' AND i.name = 'Associação Comunitária Esperança'
UNION ALL
SELECT f.id, i.id, TIMESTAMP '2025-01-14 11:00:00', 15, 'Segunda entrega'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Oliveira' AND i.name = 'Associação Comunitária Esperança'
UNION ALL
SELECT f.id, i.id, TIMESTAMP '2025-01-15 13:00:00', 15, 'Terceira entrega'
FROM public.families f, public.institutions i
WHERE f.name = 'Família Santos' AND i.name = 'Associação Comunitária Esperança';