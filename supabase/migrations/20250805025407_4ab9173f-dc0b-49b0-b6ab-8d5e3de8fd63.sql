-- Criar usuários de teste no Auth e profiles correspondentes
-- Inserir profiles para os usuários bypass e novos usuários

-- Admin bypass user profile
INSERT INTO public.profiles (id, email, full_name, role, institution_id)
VALUES (
  'd1e6f7a2-b3c4-5d6e-7f8a-9b0c1d2e3f40'::uuid,
  'admin@araguari.mg.gov.br',
  'Administrador Sistema',
  'admin',
  NULL
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution_id = EXCLUDED.institution_id;

-- Institution bypass user profile
INSERT INTO public.profiles (id, email, full_name, role, institution_id)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'instituicao@casaesperanca.org.br',
  'Casa da Esperança',
  'institution',
  '12345678-1234-1234-1234-123456789012'::uuid
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  institution_id = EXCLUDED.institution_id;

-- Atualizar função get_user_role para melhor debugging
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Log do user_id recebido
  RAISE NOTICE 'get_user_role called with user_id: %', user_id;
  
  -- Verificar se user_id é nulo
  IF user_id IS NULL THEN
    RAISE NOTICE 'user_id is NULL, returning institution';
    RETURN 'institution'::user_role;
  END IF;
  
  -- Primeiro, tentar buscar na tabela profiles
  DECLARE
    user_role_result user_role;
  BEGIN
    SELECT role INTO user_role_result 
    FROM public.profiles 
    WHERE id = user_id;
    
    RAISE NOTICE 'Found role in profiles: %', user_role_result;
    
    -- Se encontrou o usuário, retornar o role
    IF user_role_result IS NOT NULL THEN
      RETURN user_role_result;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log do erro mas continua com fallbacks
      RAISE NOTICE 'Erro ao buscar role do usuário %: %', user_id, SQLERRM;
  END;
  
  -- Fallback para usuários bypass baseado no UUID
  -- Admin bypass user
  IF user_id = 'd1e6f7a2-b3c4-5d6e-7f8a-9b0c1d2e3f40'::uuid THEN
    RAISE NOTICE 'Using admin bypass';
    RETURN 'admin'::user_role;
  END IF;
  
  -- Institution bypass user
  IF user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid THEN
    RAISE NOTICE 'Using institution bypass';
    RETURN 'institution'::user_role;
  END IF;
  
  -- Fallback padrão: institution
  RAISE NOTICE 'Using default institution role';
  RETURN 'institution'::user_role;
END;
$function$;

-- Atualizar função get_user_institution para melhor debugging
CREATE OR REPLACE FUNCTION public.get_user_institution(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Log do user_id recebido
  RAISE NOTICE 'get_user_institution called with user_id: %', user_id;
  
  -- Verificar se user_id é nulo
  IF user_id IS NULL THEN
    RAISE NOTICE 'user_id is NULL, returning NULL';
    RETURN NULL;
  END IF;
  
  -- Primeiro, tentar buscar na tabela profiles
  DECLARE
    institution_id_result uuid;
  BEGIN
    SELECT institution_id INTO institution_id_result 
    FROM public.profiles 
    WHERE id = user_id;
    
    RAISE NOTICE 'Found institution_id in profiles: %', institution_id_result;
    
    -- Se encontrou o usuário e tem institution_id, retornar
    IF institution_id_result IS NOT NULL THEN
      RETURN institution_id_result;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log do erro mas continua com fallbacks
      RAISE NOTICE 'Erro ao buscar institution_id do usuário %: %', user_id, SQLERRM;
  END;
  
  -- Fallback para usuário institution bypass
  IF user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid THEN
    RAISE NOTICE 'Using institution bypass institution_id';
    -- Retornar um UUID fixo para a instituição teste
    RETURN '12345678-1234-1234-1234-123456789012'::uuid;
  END IF;
  
  -- Para usuários admin ou outros casos, retornar NULL
  RAISE NOTICE 'Returning NULL for admin or unknown user';
  RETURN NULL;
END;
$function$;