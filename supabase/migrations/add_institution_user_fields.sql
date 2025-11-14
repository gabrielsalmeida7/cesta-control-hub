-- Migration: Adicionar campos de usuário na tabela institutions e função para criar usuário automaticamente
-- Data: 2025-01-XX
-- Descrição: Adiciona campos email, responsible_name e função para criar usuário de login automaticamente

-- 1. Adicionar colunas na tabela institutions
ALTER TABLE public.institutions 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS responsible_name TEXT;

-- 2. Adicionar constraint de unicidade para email
CREATE UNIQUE INDEX IF NOT EXISTS idx_institutions_email_unique 
ON public.institutions(email) 
WHERE email IS NOT NULL;

-- 3. Adicionar constraint para garantir que email seja válido (formato básico)
ALTER TABLE public.institutions
ADD CONSTRAINT institutions_email_format 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 4. Tornar email obrigatório para novas instituições (mas não para as existentes)
-- Vamos fazer isso via constraint que permite NULL temporariamente
-- Mas vamos garantir que novas inserções tenham email

-- 5. Comentários nas colunas
COMMENT ON COLUMN public.institutions.email IS 'Email da instituição usado para login do usuário';
COMMENT ON COLUMN public.institutions.responsible_name IS 'Nome do responsável pela instituição';

-- 6. Criar função para vincular perfil de usuário existente à instituição
-- Esta função será chamada após o frontend criar o usuário via Admin API
CREATE OR REPLACE FUNCTION public.link_institution_user(
  p_user_id UUID,
  p_institution_id UUID,
  p_responsible_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_role TEXT;
  v_user_email TEXT;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular usuários a instituições';
  END IF;
  
  -- Verificar se a instituição existe
  IF NOT EXISTS (SELECT 1 FROM public.institutions WHERE id = p_institution_id) THEN
    RAISE EXCEPTION 'Instituição não encontrada';
  END IF;
  
  -- Verificar se o usuário existe
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  -- Criar ou atualizar perfil vinculando à instituição
  INSERT INTO public.profiles (id, email, full_name, role, institution_id)
  VALUES (p_user_id, v_user_email, p_responsible_name, 'institution', p_institution_id)
  ON CONFLICT (id) 
  DO UPDATE SET
    full_name = p_responsible_name,
    role = 'institution',
    institution_id = p_institution_id,
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.link_institution_user IS 'Vincula um usuário existente (criado via Admin API) a uma instituição, criando/atualizando o perfil.';

-- 7. Criar função para validar criação de usuário (verifica se email já existe)
CREATE OR REPLACE FUNCTION public.validate_institution_user_creation(
  p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários de instituição';
  END IF;
  
  -- Verificar se já existe usuário com este email
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já está em uso';
  END IF;
  
  -- Verificar se já existe perfil com este email
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já está em uso';
  END IF;
  
  -- Verificar se já existe instituição com este email
  IF EXISTS (SELECT 1 FROM public.institutions WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já está cadastrado em outra instituição';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.validate_institution_user_creation IS 'Valida se é possível criar usuário com o email fornecido. Retorna true se o email está disponível.';

