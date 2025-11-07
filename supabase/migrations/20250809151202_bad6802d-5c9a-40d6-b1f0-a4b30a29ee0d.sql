-- Phase 1: RLS + Seed + Trigger

-- 1) RLS: permitir que o usuário insira seu próprio perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2) Semear dados mínimos
-- 2.1 Instituição principal (usa o mesmo UUID usado pelo fallback da função get_user_institution)
INSERT INTO public.institutions (id, name, address, phone)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  'Casa da Esperança',
  'Rua Exemplo, 123 - Araguari, MG',
  '(34) 99999-0000'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  updated_at = now();

-- 2.2 Famílias
INSERT INTO public.families (id, name, contact_person, phone)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Família Silva', 'Maria Silva', '(34) 98888-1111'),
  ('22222222-2222-2222-2222-222222222222', 'Família Souza', 'João Souza', '(34) 97777-2222'),
  ('33333333-3333-3333-3333-333333333333', 'Família Oliveira', 'Ana Oliveira', '(34) 96666-3333')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  contact_person = EXCLUDED.contact_person,
  phone = EXCLUDED.phone,
  updated_at = now();

-- 2.3 Associação instituição-família (idempotente)
INSERT INTO public.institution_families (institution_id, family_id)
SELECT '12345678-1234-1234-1234-123456789012'::uuid, f.id
FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid),
  ('33333333-3333-3333-3333-333333333333'::uuid)
) v(id)
JOIN public.families f ON f.id = v.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.institution_families ifa
  WHERE ifa.institution_id = '12345678-1234-1234-1234-123456789012'::uuid
    AND ifa.family_id = v.id
);

-- 2.4 Entregas
INSERT INTO public.deliveries (family_id, institution_id, delivery_date, blocking_period_days, notes)
VALUES
  ('11111111-1111-1111-1111-111111111111', '12345678-1234-1234-1234-123456789012', now() - interval '5 days', 30, 'Entrega mensal'),
  ('22222222-2222-2222-2222-222222222222', '12345678-1234-1234-1234-123456789012', now() - interval '15 days', 30, 'Entrega mensal'),
  ('33333333-3333-3333-3333-333333333333', '12345678-1234-1234-1234-123456789012', now() - interval '35 days', 30, 'Entrega anterior')
ON CONFLICT DO NOTHING;

-- 3) Trigger para bloquear família após entrega (usa função já existente public.update_family_blocking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_family_blocking'
  ) THEN
    CREATE TRIGGER trg_update_family_blocking
    AFTER INSERT ON public.deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_family_blocking();
  END IF;
END $$;

-- Verificações (não alteram estado)
-- Contagens para facilitar conferência
SELECT 'institutions' AS entity, COUNT(*) AS total FROM public.institutions;
SELECT 'families' AS entity, COUNT(*) AS total FROM public.families;
SELECT 'institution_families' AS entity, COUNT(*) AS total FROM public.institution_families;
SELECT 'deliveries' AS entity, COUNT(*) AS total FROM public.deliveries;