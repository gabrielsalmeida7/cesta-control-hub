-- Primeiro, vamos criar usuários reais no sistema Auth
-- Para isso, vou inserir diretamente na tabela auth.users (simulando signup)

-- Inserir usuário admin real
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_sent_at,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  'e8f5c123-4567-890a-bcde-f123456789ab'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@araguari.mg.gov.br',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  '',
  NULL,
  '',
  '',
  '',
  NULL,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrador Sistema", "role": "admin"}',
  false,
  now(),
  now(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  now(),
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  false
) ON CONFLICT (id) DO NOTHING;

-- Inserir usuário instituição real
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_sent_at,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  'f9a6d234-5678-901b-cdef-234567890abc'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'instituicao@casaesperanca.org.br',
  crypt('inst123', gen_salt('bf')),
  now(),
  now(),
  '',
  NULL,
  '',
  '',
  '',
  NULL,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Casa da Esperança", "role": "institution", "institution_id": "12345678-1234-1234-1234-123456789012"}',
  false,
  now(),
  now(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  now(),
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  false
) ON CONFLICT (id) DO NOTHING;

-- Agora inserir os profiles correspondentes
INSERT INTO public.profiles (id, email, full_name, role, institution_id)
VALUES (
  'e8f5c123-4567-890a-bcde-f123456789ab'::uuid,
  'admin@araguari.mg.gov.br',
  'Administrador Sistema',
  'admin',
  NULL
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution_id = EXCLUDED.institution_id;

INSERT INTO public.profiles (id, email, full_name, role, institution_id)
VALUES (
  'f9a6d234-5678-901b-cdef-234567890abc'::uuid,
  'instituicao@casaesperanca.org.br',
  'Casa da Esperança',
  'institution',
  '12345678-1234-1234-1234-123456789012'::uuid
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution_id = EXCLUDED.institution_id;

-- Também criar profiles para os usuários bypass (sem auth.users, só para RLS)
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