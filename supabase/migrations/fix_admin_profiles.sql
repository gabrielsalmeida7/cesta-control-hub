-- Migration: Verificar e corrigir perfis de admin
-- Data: 2025-11-17
-- Descrição: Garante que usuários admin tenham role 'admin' no perfil

-- Verificar perfis existentes antes da correção
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  CASE 
    WHEN p.email = 'teste@admin.com' OR p.email = 'gabriel.salmeida7@gmail.com' THEN 'Deve ser admin'
    ELSE 'Verificar'
  END as expected_role
FROM profiles p
WHERE p.email IN ('teste@admin.com', 'gabriel.salmeida7@gmail.com');

-- Atualizar gabriel.salmeida7@gmail.com para admin (se necessário)
-- IMPORTANTE: Admins não podem ter institution_id (constraint profiles_institution_logic)
UPDATE profiles
SET 
  role = 'admin',
  institution_id = NULL  -- Limpar institution_id para satisfazer a constraint
WHERE email = 'gabriel.salmeida7@gmail.com'
  AND (role IS NULL OR role != 'admin');

-- Verificar resultado após correção
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  'Verificado' as status
FROM profiles p
WHERE p.email IN ('teste@admin.com', 'gabriel.salmeida7@gmail.com');

-- Comentário
COMMENT ON COLUMN profiles.role IS 
'Role do usuário: "admin" para administradores, "institution" para usuários de instituições. Deve ser definido corretamente para garantir acesso adequado.';

