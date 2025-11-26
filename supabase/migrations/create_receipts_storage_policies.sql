-- Migration: Criar políticas RLS para bucket receipts
-- Data: 2025-01-XX
-- Descrição: Políticas de segurança para acesso ao bucket de recibos (bucket privado)

-- IMPORTANTE: 
-- No Supabase, políticas de storage não podem ser criadas diretamente via SQL
-- devido a restrições de permissão. Use uma das opções abaixo:
--
-- OPÇÃO 1 (RECOMENDADA): Criar via Dashboard do Supabase
-- 1. Acesse Storage → Buckets → receipts → Policies
-- 2. Clique em "New Policy"
-- 3. Use os templates abaixo para cada política
--
-- OPÇÃO 2: Executar via função com privilégios elevados (requer service_role)
-- Execute este arquivo apenas se tiver acesso ao service_role key

-- ============================================================================
-- POLÍTICA 1: Upload de Recibos (SIMPLIFICADA PARA BUCKET PÚBLICO)
-- ============================================================================
-- Nome: "Permitir upload de recibos"
-- Operação: INSERT
-- Target roles: authenticated
-- WITH CHECK expression (VERSÃO SIMPLES):
/*
bucket_id = 'receipts'
*/

-- VERSÃO ORIGINAL (mais restritiva, pode causar erro):
/*
bucket_id = 'receipts' AND
(storage.foldername(name))[1] = 'receipts'
*/

-- ============================================================================
-- POLÍTICA 2: Leitura de Recibos
-- ============================================================================
-- Nome: "Usuários podem ler recibos de sua instituição"
-- Operação: SELECT
-- Target roles: authenticated
-- USING expression:
/*
bucket_id = 'receipts' AND
(
  -- Admin pode ler todos os recibos
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Usuário de instituição pode ler apenas recibos de sua instituição
  EXISTS (
    SELECT 1 FROM public.receipts r
    JOIN public.profiles p ON p.institution_id = r.institution_id
    WHERE r.file_path = name
    AND p.id = auth.uid()
    AND p.role = 'institution'
  )
)
*/

-- ============================================================================
-- POLÍTICA 3: Atualização de Recibos
-- ============================================================================
-- Nome: "Usuários podem atualizar recibos de sua instituição"
-- Operação: UPDATE
-- Target roles: authenticated
-- USING expression:
/*
bucket_id = 'receipts' AND
(
  -- Admin pode atualizar todos os recibos
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Usuário de instituição pode atualizar apenas recibos de sua instituição
  EXISTS (
    SELECT 1 FROM public.receipts r
    JOIN public.profiles p ON p.institution_id = r.institution_id
    WHERE r.file_path = name
    AND p.id = auth.uid()
    AND p.role = 'institution'
  )
)
*/

-- ============================================================================
-- POLÍTICA 4: Deleção de Recibos
-- ============================================================================
-- Nome: "Usuários podem deletar recibos de sua instituição"
-- Operação: DELETE
-- Target roles: authenticated
-- USING expression:
/*
bucket_id = 'receipts' AND
(
  -- Admin pode deletar todos os recibos
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Usuário de instituição pode deletar apenas recibos de sua instituição
  EXISTS (
    SELECT 1 FROM public.receipts r
    JOIN public.profiles p ON p.institution_id = r.institution_id
    WHERE r.file_path = name
    AND p.id = auth.uid()
    AND p.role = 'institution'
  )
)
*/

-- Comentário de documentação
COMMENT ON POLICY "Usuários autenticados podem fazer upload de recibos" ON storage.objects IS
'Permite que usuários autenticados façam upload de recibos no bucket receipts';

COMMENT ON POLICY "Usuários podem ler recibos de sua instituição" ON storage.objects IS
'Permite que usuários leiam apenas recibos de sua própria instituição. Admin pode ler todos.';

COMMENT ON POLICY "Usuários podem atualizar recibos de sua instituição" ON storage.objects IS
'Permite que usuários atualizem apenas recibos de sua própria instituição. Admin pode atualizar todos.';

COMMENT ON POLICY "Usuários podem deletar recibos de sua instituição" ON storage.objects IS
'Permite que usuários deletem apenas recibos de sua própria instituição. Admin pode deletar todos.';

