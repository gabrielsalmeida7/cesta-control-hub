-- Passo 3: Inserir Dados de Teste no Banco (sem foreign keys para auth.users)

-- Primeiro, criar uma instituição teste
INSERT INTO public.institutions (id, name, address, phone, created_at, updated_at)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  'Casa da Esperança - Instituição Teste',
  'Rua das Flores, 123 - Centro - Araguari/MG',
  '(34) 3241-1234',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  updated_at = now();

-- Criar mais instituições para popular o dashboard admin
INSERT INTO public.institutions (id, name, address, phone, created_at, updated_at)
VALUES 
  (
    '22345678-1234-1234-1234-123456789012',
    'Lar São José',
    'Av. Principal, 456 - Bairro Norte - Araguari/MG',
    '(34) 3241-2345',
    now(),
    now()
  ),
  (
    '32345678-1234-1234-1234-123456789012',
    'Centro Comunitário Unidos',
    'Rua da Paz, 789 - Vila Esperança - Araguari/MG',
    '(34) 3241-3456',
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  updated_at = now();

-- Criar algumas famílias de teste para popular os dashboards
INSERT INTO public.families (id, name, contact_person, phone, members_count, is_blocked, blocked_until, blocked_by_institution_id, block_reason, created_at, updated_at)
VALUES 
  (
    'f1111111-1111-1111-1111-111111111111',
    'Família Silva',
    'Maria Silva',
    '(34) 9999-1111',
    4,
    false,
    NULL,
    NULL,
    NULL,
    now(),
    now()
  ),
  (
    'f2222222-2222-2222-2222-222222222222',
    'Família Santos',
    'João Santos',
    '(34) 9999-2222',
    3,
    false,
    NULL,
    NULL,
    NULL,
    now(),
    now()
  ),
  (
    'f3333333-3333-3333-3333-333333333333',
    'Família Oliveira',
    'Ana Oliveira',
    '(34) 9999-3333',
    5,
    true,
    now() + INTERVAL '30 days',
    '12345678-1234-1234-1234-123456789012',
    'Recebeu cesta básica',
    now(),
    now()
  ),
  (
    'f4444444-4444-4444-4444-444444444444',
    'Família Costa',
    'Pedro Costa',
    '(34) 9999-4444',
    2,
    false,
    NULL,
    NULL,
    NULL,
    now(),
    now()
  ),
  (
    'f5555555-5555-5555-5555-555555555555',
    'Família Pereira',
    'Carmen Pereira',
    '(34) 9999-5555',
    6,
    false,
    NULL,
    NULL,
    NULL,
    now(),
    now()
  ),
  (
    'f6666666-6666-6666-6666-666666666666',
    'Família Rodrigues',
    'José Rodrigues',
    '(34) 9999-6666',
    3,
    false,
    NULL,
    NULL,
    NULL,
    now(),
    now()
  ),
  (
    'f7777777-7777-7777-7777-777777777777',
    'Família Almeida',
    'Carla Almeida',
    '(34) 9999-7777',
    4,
    true,
    now() + INTERVAL '15 days',
    '22345678-1234-1234-1234-123456789012',
    'Benefício temporário',
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  contact_person = EXCLUDED.contact_person,
  phone = EXCLUDED.phone,
  members_count = EXCLUDED.members_count,
  updated_at = now();

-- Associar famílias às instituições de teste
INSERT INTO public.institution_families (institution_id, family_id, created_at)
VALUES 
  ('12345678-1234-1234-1234-123456789012', 'f1111111-1111-1111-1111-111111111111', now()),
  ('12345678-1234-1234-1234-123456789012', 'f2222222-2222-2222-2222-222222222222', now()),
  ('12345678-1234-1234-1234-123456789012', 'f3333333-3333-3333-3333-333333333333', now()),
  ('12345678-1234-1234-1234-123456789012', 'f4444444-4444-4444-4444-444444444444', now()),
  ('12345678-1234-1234-1234-123456789012', 'f5555555-5555-5555-5555-555555555555', now()),
  ('22345678-1234-1234-1234-123456789012', 'f6666666-6666-6666-6666-666666666666', now()),
  ('22345678-1234-1234-1234-123456789012', 'f7777777-7777-7777-7777-777777777777', now())
ON CONFLICT (institution_id, family_id) DO NOTHING;

-- Criar algumas entregas de teste (sem delivered_by_user_id para evitar foreign key)
INSERT INTO public.deliveries (id, family_id, institution_id, delivery_date, blocking_period_days, delivered_by_user_id, notes, created_at)
VALUES 
  (
    'd1111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '5 days',
    30,
    NULL,
    'Entrega de cesta básica completa',
    now() - INTERVAL '5 days'
  ),
  (
    'd2222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '10 days',
    30,
    NULL,
    'Entrega de emergência',
    now() - INTERVAL '10 days'
  ),
  (
    'd3333333-3333-3333-3333-333333333333',
    'f3333333-3333-3333-3333-333333333333',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '15 days',
    30,
    NULL,
    'Cesta com produtos especiais',
    now() - INTERVAL '15 days'
  ),
  (
    'd4444444-4444-4444-4444-444444444444',
    'f4444444-4444-4444-4444-444444444444',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '20 days',
    30,
    NULL,
    'Doação especial',
    now() - INTERVAL '20 days'
  ),
  (
    'd5555555-5555-5555-5555-555555555555',
    'f5555555-5555-5555-5555-555555555555',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '25 days',
    30,
    NULL,
    'Entrega mensal',
    now() - INTERVAL '25 days'
  ),
  (
    'd6666666-6666-6666-6666-666666666666',
    'f6666666-6666-6666-6666-666666666666',
    '22345678-1234-1234-1234-123456789012',
    now() - INTERVAL '3 days',
    30,
    NULL,
    'Cesta emergencial',
    now() - INTERVAL '3 days'
  ),
  (
    'd7777777-7777-7777-7777-777777777777',
    'f7777777-7777-7777-7777-777777777777',
    '22345678-1234-1234-1234-123456789012',
    now() - INTERVAL '7 days',
    30,
    NULL,
    'Atendimento especial',
    now() - INTERVAL '7 days'
  )
ON CONFLICT (id) DO UPDATE SET
  delivery_date = EXCLUDED.delivery_date,
  notes = EXCLUDED.notes;