-- Passo 3: Inserir Dados de Teste no Banco (sem foreign key para auth.users)

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

-- Criar algumas famílias de teste para popular os dashboards
INSERT INTO public.families (id, name, contact_person, phone, members_count, is_blocked, blocked_until, blocked_by_institution_id, block_reason, created_at, updated_at)
VALUES 
  (
    'fam11111-1111-1111-1111-111111111111',
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
    'fam22222-2222-2222-2222-222222222222',
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
    'fam33333-3333-3333-3333-333333333333',
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
    'fam44444-4444-4444-4444-444444444444',
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
    'fam55555-5555-5555-5555-555555555555',
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
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  contact_person = EXCLUDED.contact_person,
  phone = EXCLUDED.phone,
  members_count = EXCLUDED.members_count,
  updated_at = now();

-- Associar famílias à instituição de teste
INSERT INTO public.institution_families (institution_id, family_id, created_at)
VALUES 
  ('12345678-1234-1234-1234-123456789012', 'fam11111-1111-1111-1111-111111111111', now()),
  ('12345678-1234-1234-1234-123456789012', 'fam22222-2222-2222-2222-222222222222', now()),
  ('12345678-1234-1234-1234-123456789012', 'fam33333-3333-3333-3333-333333333333', now()),
  ('12345678-1234-1234-1234-123456789012', 'fam44444-4444-4444-4444-444444444444', now()),
  ('12345678-1234-1234-1234-123456789012', 'fam55555-5555-5555-5555-555555555555', now())
ON CONFLICT (institution_id, family_id) DO NOTHING;

-- Criar algumas entregas de teste para popular gráficos e relatórios
INSERT INTO public.deliveries (id, family_id, institution_id, delivery_date, blocking_period_days, delivered_by_user_id, notes, created_at)
VALUES 
  (
    'del11111-1111-1111-1111-111111111111',
    'fam11111-1111-1111-1111-111111111111',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '5 days',
    30,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Entrega de cesta básica completa',
    now() - INTERVAL '5 days'
  ),
  (
    'del22222-2222-2222-2222-222222222222',
    'fam22222-2222-2222-2222-222222222222',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '10 days',
    30,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Entrega de emergência',
    now() - INTERVAL '10 days'
  ),
  (
    'del33333-3333-3333-3333-333333333333',
    'fam33333-3333-3333-3333-333333333333',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '15 days',
    30,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Cesta com produtos especiais',
    now() - INTERVAL '15 days'
  ),
  (
    'del44444-4444-4444-4444-444444444444',
    'fam44444-4444-4444-4444-444444444444',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '20 days',
    30,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Doação especial',
    now() - INTERVAL '20 days'
  ),
  (
    'del55555-5555-5555-5555-555555555555',
    'fam55555-5555-5555-5555-555555555555',
    '12345678-1234-1234-1234-123456789012',
    now() - INTERVAL '25 days',
    30,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Entrega mensal',
    now() - INTERVAL '25 days'
  )
ON CONFLICT (id) DO UPDATE SET
  delivery_date = EXCLUDED.delivery_date,
  notes = EXCLUDED.notes;