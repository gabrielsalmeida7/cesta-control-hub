-- Migration: Verificar e corrigir TODOS os perfis de admin
-- Data: 2025-11-17
-- Descrição: Garante que TODOS os usuários admin tenham role 'admin' e institution_id = NULL
--             Corrige violações da constraint profiles_institution_logic

-- 1. Verificar perfis que violam a constraint (admin com institution_id preenchido)
SELECT 
  p.id,
  p.email,
  p.role,
  p.institution_id,
  p.full_name,
  'VIOLANDO CONSTRAINT' as status
FROM profiles p
WHERE p.role = 'admin' 
  AND p.institution_id IS NOT NULL;

-- 2. Corrigir TODOS os admins que têm institution_id preenchido
-- IMPORTANTE: Admins não podem ter institution_id (constraint profiles_institution_logic)
UPDATE profiles
SET institution_id = NULL
WHERE role = 'admin' 
  AND institution_id IS NOT NULL;

-- 3. Verificar emails específicos que devem ser admin (opcional - ajustar conforme necessário)
-- Se você tiver outros emails que devem ser admin, adicione aqui
UPDATE profiles
SET 
  role = 'admin',
  institution_id = NULL  -- Limpar institution_id para satisfazer a constraint
WHERE email IN ('teste@admin.com', 'gabriel.salmeida7@gmail.com')
  AND (role IS NULL OR role != 'admin');

-- 4. Verificar resultado final - todos os admins devem ter institution_id = NULL
SELECT 
  p.id,
  p.email,
  p.role,
  p.institution_id,
  p.full_name,
  CASE 
    WHEN p.role = 'admin' AND p.institution_id IS NULL THEN '✅ Correto'
    WHEN p.role = 'admin' AND p.institution_id IS NOT NULL THEN '❌ ERRO: Deve ter institution_id = NULL'
    ELSE 'Verificar'
  END as status
FROM profiles p
WHERE p.role = 'admin'
ORDER BY p.email;

-- 5. Verificar se há violações restantes da constraint
SELECT 
  COUNT(*) as total_violacoes,
  'Perfis admin com institution_id preenchido' as descricao
FROM profiles
WHERE role = 'admin' 
  AND institution_id IS NOT NULL;

-- Comentário
COMMENT ON COLUMN profiles.role IS 
'Role do usuário: "admin" para administradores, "institution" para usuários de instituições. Admins NUNCA devem ter institution_id preenchido (constraint profiles_institution_logic).';

