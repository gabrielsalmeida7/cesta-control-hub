-- Inserir perfis de teste para os usuários de bypass
INSERT INTO public.profiles (id, email, full_name, role, institution_id) VALUES
('11111111-2222-4333-8444-555555555555', 'admin@araguari.mg.gov.br', 'Administrador Sistema', 'admin', NULL)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution_id = EXCLUDED.institution_id;

INSERT INTO public.profiles (id, email, full_name, role, institution_id) VALUES
('22222222-3333-4444-8555-666666666666', 'instituicao@casesperanca.org.br', 'Responsável Instituição', 'institution', 'b9e546e9-6443-460c-a6e1-d8d86efb0971')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution_id = EXCLUDED.institution_id;

-- Atualizar as funções RLS para funcionar com usuários de bypass
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  -- Primeiro tenta buscar na tabela profiles
  SELECT role FROM public.profiles WHERE id = user_id
  UNION ALL
  -- Se não encontrar e for um dos IDs de bypass, retorna o papel correspondente
  SELECT CASE 
    WHEN user_id = '11111111-2222-4333-8444-555555555555'::uuid THEN 'admin'::user_role
    WHEN user_id = '22222222-3333-4444-8555-666666666666'::uuid THEN 'institution'::user_role
    ELSE NULL
  END
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id)
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_institution(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  -- Primeiro tenta buscar na tabela profiles
  SELECT institution_id FROM public.profiles WHERE id = user_id
  UNION ALL
  -- Se não encontrar e for o ID de bypass da instituição, retorna o institution_id
  SELECT CASE 
    WHEN user_id = '22222222-3333-4444-8555-666666666666'::uuid THEN 'b9e546e9-6443-460c-a6e1-d8d86efb0971'::uuid
    ELSE NULL
  END
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id)
  LIMIT 1;
$function$;