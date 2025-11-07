-- Passo 1: Corrigir as Funções RLS para suportar usuários bypass (UUIDs corrigidos)

-- Atualizar a função get_user_role para ter fallbacks e suportar bypass
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Primeiro, tentar buscar na tabela profiles
  DECLARE
    user_role_result user_role;
  BEGIN
    SELECT role INTO user_role_result 
    FROM public.profiles 
    WHERE id = user_id;
    
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
    RETURN 'admin'::user_role;
  END IF;
  
  -- Institution bypass user
  IF user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid THEN
    RETURN 'institution'::user_role;
  END IF;
  
  -- Fallback padrão: institution
  RETURN 'institution'::user_role;
END;
$$;

-- Atualizar a função get_user_institution para suportar bypass
CREATE OR REPLACE FUNCTION public.get_user_institution(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Primeiro, tentar buscar na tabela profiles
  DECLARE
    institution_id_result uuid;
  BEGIN
    SELECT institution_id INTO institution_id_result 
    FROM public.profiles 
    WHERE id = user_id;
    
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
    -- Retornar um UUID fixo para a instituição teste
    RETURN '12345678-1234-1234-1234-123456789012'::uuid;
  END IF;
  
  -- Para usuários admin ou outros casos, retornar NULL
  RETURN NULL;
END;
$$;

-- Criar função auxiliar para verificar se é usuário bypass
CREATE OR REPLACE FUNCTION public.is_bypass_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT user_id IN (
    'd1e6f7a2-b3c4-5d6e-7f8a-9b0c1d2e3f40'::uuid,  -- admin bypass
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid    -- institution bypass
  );
$$;