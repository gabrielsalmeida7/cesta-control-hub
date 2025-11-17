-- Script para corrigir perfis de instituição que foram criados incorretamente com role 'admin'
-- Execute este script no Supabase SQL Editor se encontrar perfis com role incorreto

-- 1. Verificar perfis que têm email na tabela institutions mas role está como 'admin'
-- Esta query mostra os perfis que precisam ser corrigidos
SELECT 
  p.id,
  p.email,
  p.role,
  p.institution_id,
  i.id as institution_id_from_table,
  i.name as institution_name
FROM public.profiles p
LEFT JOIN public.institutions i ON i.email = p.email
WHERE p.role = 'admin' 
  AND i.email IS NOT NULL
  AND p.email != 'teste@admin.com'; -- Excluir o admin seed

-- 2. Corrigir perfis: atualizar role para 'institution' e vincular institution_id
-- ATENÇÃO: Execute apenas se tiver certeza que esses usuários devem ser instituições
UPDATE public.profiles p
SET 
  role = 'institution',
  institution_id = i.id,
  updated_at = now()
FROM public.institutions i
WHERE p.email = i.email
  AND p.role = 'admin'
  AND p.email != 'teste@admin.com'; -- Excluir o admin seed
  -- AND p.id = 'a7fc5f58-6892-4490-92cf-3aa9a8c861c9'; -- Descomente para corrigir apenas um usuário específico

-- 3. Verificar resultado após correção
SELECT 
  p.id,
  p.email,
  p.role,
  p.institution_id,
  i.name as institution_name
FROM public.profiles p
LEFT JOIN public.institutions i ON i.id = p.institution_id
WHERE p.email IN (
  SELECT email FROM public.institutions WHERE email IS NOT NULL
);

