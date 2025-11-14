-- Script para limpar instituições órfãs (criadas sem usuário vinculado)
-- Execute este script se houver instituições criadas sem usuário devido a erros

-- 1. Verificar instituições sem usuário vinculado
-- (instituições que têm email mas não têm perfil correspondente)
SELECT 
  i.id,
  i.name,
  i.email,
  i.created_at
FROM public.institutions i
WHERE i.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.email = i.email
  );

-- 2. Se quiser DELETAR essas instituições órfãs, descomente as linhas abaixo:
-- DELETE FROM public.institutions
-- WHERE email IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 
--     FROM public.profiles p 
--     WHERE p.email = institutions.email
--   );

-- 3. Ou se preferir apenas remover o email (para permitir recriação):
-- UPDATE public.institutions
-- SET email = NULL, responsible_name = NULL
-- WHERE email IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 
--     FROM public.profiles p 
--     WHERE p.email = institutions.email
--   );

