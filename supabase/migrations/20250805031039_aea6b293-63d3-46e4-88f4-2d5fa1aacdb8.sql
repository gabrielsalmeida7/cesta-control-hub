-- Criar profiles para os usuários bypass (podem existir sem auth.users para bypass)
INSERT INTO public.profiles (id, email, full_name, role, institution_id)
VALUES (
  'd1e6f7a2-b3c4-5d6e-7f8a-9b0c1d2e3f40'::uuid,
  'bypass-admin@araguari.mg.gov.br',
  'Bypass Administrador',
  'admin',
  NULL
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution_id = EXCLUDED.institution_id;

INSERT INTO public.profiles (id, email, full_name, role, institution_id)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'bypass-instituicao@casaesperanca.org.br',
  'Bypass Casa da Esperança',
  'institution',
  '12345678-1234-1234-1234-123456789012'::uuid
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution_id = EXCLUDED.institution_id;

-- Verificar se os dados estão corretos
SELECT 'Profiles criados:' as status;
SELECT id, email, full_name, role, institution_id FROM public.profiles;

SELECT 'Total institutions:' as status;  
SELECT COUNT(*) as count FROM public.institutions;

SELECT 'Total families:' as status;
SELECT COUNT(*) as count FROM public.families;

SELECT 'Total deliveries:' as status;
SELECT COUNT(*) as count FROM public.deliveries;