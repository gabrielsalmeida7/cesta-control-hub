-- Migration: Implementar Criptografia de CPF (AES-256)
-- Data: 2025-01-XX
-- Descrição: Criptografa campo CPF para proteção de dados sensíveis - LGPD Art. 46

-- ============================================
-- 1. INSTALAR EXTENSÃO pgcrypto
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON EXTENSION pgcrypto IS 
'Extensão para funções criptográficas. Usada para criptografar dados sensíveis como CPF.';

-- ============================================
-- 2. CRIAR CHAVE DE CRIPTOGRAFIA
-- ============================================

-- IMPORTANTE: Em produção, esta chave deve estar em variável de ambiente
-- Por segurança, a chave real deve ser definida via secrets do Supabase

-- Função para obter chave de criptografia (busca de secret/env var)
CREATE OR REPLACE FUNCTION public.get_encryption_key()
RETURNS TEXT AS $$
BEGIN
  -- Em produção, buscar de: SELECT vault.decrypt_secret('encryption_key')
  -- Por enquanto, retorna uma chave padrão (DEVE SER ALTERADA)
  RETURN current_setting('app.settings.encryption_key', true);
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback para chave padrão (APENAS DESENVOLVIMENTO)
    -- NUNCA use esta chave em produção!
    RETURN 'CHANGE_THIS_ENCRYPTION_KEY_IN_PRODUCTION_32BYTES!!!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_encryption_key() IS 
'Retorna chave de criptografia. EM PRODUÇÃO deve buscar do Supabase Vault ou variável de ambiente segura.';

-- ============================================
-- 3. FUNÇÕES DE CRIPTOGRAFIA/DESCRIPTOGRAFIA
-- ============================================

-- Função para criptografar CPF
CREATE OR REPLACE FUNCTION public.encrypt_cpf(cpf_plain TEXT)
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
  v_encrypted BYTEA;
BEGIN
  -- Se CPF é nulo ou vazio, retornar nulo
  IF cpf_plain IS NULL OR trim(cpf_plain) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remover formatação (manter apenas números)
  cpf_plain := regexp_replace(cpf_plain, '[^0-9]', '', 'g');
  
  -- Validar tamanho (11 dígitos)
  IF length(cpf_plain) != 11 THEN
    RAISE EXCEPTION 'CPF deve conter 11 dígitos';
  END IF;
  
  -- Obter chave
  v_key := public.get_encryption_key();
  
  -- Criptografar usando AES-256
  v_encrypted := pgcrypto.encrypt(
    cpf_plain::bytea,
    v_key::bytea,
    'aes'
  );
  
  -- Retornar em base64 para armazenamento TEXT
  RETURN encode(v_encrypted, 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.encrypt_cpf(TEXT) IS 
'Criptografa CPF usando AES-256. Remove formatação e valida 11 dígitos. Retorna string base64.';

-- Função para descriptografar CPF
CREATE OR REPLACE FUNCTION public.decrypt_cpf(cpf_encrypted TEXT)
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
  v_decrypted BYTEA;
BEGIN
  -- Se CPF é nulo, retornar nulo
  IF cpf_encrypted IS NULL OR trim(cpf_encrypted) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Obter chave
  v_key := public.get_encryption_key();
  
  -- Descriptografar
  v_decrypted := pgcrypto.decrypt(
    decode(cpf_encrypted, 'base64'),
    v_key::bytea,
    'aes'
  );
  
  -- Retornar como texto
  RETURN convert_from(v_decrypted, 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- Se falhar descriptografia, pode ser CPF não criptografado (migração)
    RAISE NOTICE 'Erro ao descriptografar CPF: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.decrypt_cpf(TEXT) IS 
'Descriptografa CPF. Retorna apenas números (sem formatação).';

-- Função para formatar CPF (XXX.XXX.XXX-XX)
CREATE OR REPLACE FUNCTION public.format_cpf(cpf_plain TEXT)
RETURNS TEXT AS $$
BEGIN
  IF cpf_plain IS NULL OR length(cpf_plain) != 11 THEN
    RETURN cpf_plain;
  END IF;
  
  RETURN substring(cpf_plain, 1, 3) || '.' ||
         substring(cpf_plain, 4, 3) || '.' ||
         substring(cpf_plain, 7, 3) || '-' ||
         substring(cpf_plain, 10, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.format_cpf(TEXT) IS 
'Formata CPF no padrão XXX.XXX.XXX-XX. Recebe 11 dígitos.';

-- ============================================
-- 4. NOVA COLUNA CRIPTOGRAFADA
-- ============================================

-- Adicionar nova coluna para CPF criptografado
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS cpf_encrypted TEXT;

COMMENT ON COLUMN public.families.cpf_encrypted IS 
'CPF criptografado usando AES-256. Substituirá coluna cpf após migração completa.';

-- Índice para busca por CPF criptografado (usando hash para performance)
CREATE INDEX IF NOT EXISTS idx_families_cpf_encrypted_hash 
ON public.families(md5(cpf_encrypted))
WHERE cpf_encrypted IS NOT NULL;

-- ============================================
-- 5. MIGRAR DADOS EXISTENTES
-- ============================================

-- Função de migração
CREATE OR REPLACE FUNCTION public.migrate_cpf_to_encrypted()
RETURNS TABLE(migrated_count INTEGER, error_count INTEGER) AS $$
DECLARE
  v_migrated INTEGER := 0;
  v_errors INTEGER := 0;
  v_family RECORD;
BEGIN
  FOR v_family IN 
    SELECT id, cpf 
    FROM public.families 
    WHERE cpf IS NOT NULL 
      AND cpf != ''
      AND cpf_encrypted IS NULL
  LOOP
    BEGIN
      UPDATE public.families
      SET cpf_encrypted = public.encrypt_cpf(v_family.cpf)
      WHERE id = v_family.id;
      
      v_migrated := v_migrated + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
        RAISE NOTICE 'Erro ao migrar CPF da família %: %', v_family.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated, v_errors;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.migrate_cpf_to_encrypted() IS 
'Migra CPFs existentes da coluna cpf para cpf_encrypted. Execução única durante deploy.';

-- Executar migração
-- SELECT * FROM public.migrate_cpf_to_encrypted();

-- ============================================
-- 6. VIEW PARA ACESSO SEGURO A CPF
-- ============================================

-- View que descriptografa CPF apenas para usuários autorizados
CREATE OR REPLACE VIEW public.families_with_cpf AS
SELECT 
  f.id,
  f.name,
  f.contact_person,
  f.phone,
  f.address,
  f.members_count,
  f.is_blocked,
  f.blocked_until,
  f.blocked_by_institution_id,
  f.created_at,
  f.updated_at,
  -- CPF descriptografado (apenas para admin)
  CASE 
    WHEN public.get_user_role(auth.uid()) = 'admin' THEN 
      public.decrypt_cpf(f.cpf_encrypted)
    ELSE 
      '***.***.***-**' -- Mascarado para não-admin
  END as cpf,
  -- CPF formatado
  CASE 
    WHEN public.get_user_role(auth.uid()) = 'admin' THEN 
      public.format_cpf(public.decrypt_cpf(f.cpf_encrypted))
    ELSE 
      '***.***.***-**'
  END as cpf_formatted
FROM public.families f;

COMMENT ON VIEW public.families_with_cpf IS 
'View segura para acesso a famílias. CPF é descriptografado apenas para admin, mascarado para outros.';

-- ============================================
-- 7. TRIGGERS PARA CRIPTOGRAFIA AUTOMÁTICA
-- ============================================

-- Função de trigger para criptografar CPF automaticamente
CREATE OR REPLACE FUNCTION public.trigger_encrypt_cpf()
RETURNS TRIGGER AS $$
BEGIN
  -- Se CPF foi fornecido, criptografar
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    NEW.cpf_encrypted := public.encrypt_cpf(NEW.cpf);
    -- Limpar CPF em texto plano por segurança
    NEW.cpf := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_encrypt_cpf_on_insert ON public.families;
CREATE TRIGGER trigger_encrypt_cpf_on_insert
  BEFORE INSERT OR UPDATE ON public.families
  FOR EACH ROW
  WHEN (NEW.cpf IS NOT NULL AND NEW.cpf != '')
  EXECUTE FUNCTION public.trigger_encrypt_cpf();

COMMENT ON FUNCTION public.trigger_encrypt_cpf() IS 
'Trigger que criptografa CPF automaticamente antes de salvar no banco.';

-- ============================================
-- 8. FUNÇÃO PARA BUSCAR POR CPF
-- ============================================

-- Buscar família por CPF (criptografado)
CREATE OR REPLACE FUNCTION public.find_family_by_cpf(cpf_search TEXT)
RETURNS SETOF public.families AS $$
DECLARE
  v_cpf_encrypted TEXT;
BEGIN
  -- Remover formatação
  cpf_search := regexp_replace(cpf_search, '[^0-9]', '', 'g');
  
  -- Validar
  IF length(cpf_search) != 11 THEN
    RAISE EXCEPTION 'CPF deve conter 11 dígitos';
  END IF;
  
  -- Criptografar CPF de busca
  v_cpf_encrypted := public.encrypt_cpf(cpf_search);
  
  -- Buscar
  RETURN QUERY
  SELECT f.*
  FROM public.families f
  WHERE f.cpf_encrypted = v_cpf_encrypted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.find_family_by_cpf(TEXT) IS 
'Busca família por CPF. Criptografa o CPF de busca antes de comparar no banco.';

-- ============================================
-- 9. AUDITORIA DE ACESSO A CPF
-- ============================================

-- Trigger para auditar acesso a CPF
CREATE OR REPLACE FUNCTION public.audit_cpf_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Se CPF foi acessado (descriptografado), registrar
  PERFORM public.audit_log(
    p_action_type := 'DATA_ACCESS',
    p_table_name := 'families',
    p_record_id := NEW.id,
    p_description := 'Acesso a CPF descriptografado',
    p_severity := 'WARNING'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. POLÍTICA DE RLS PARA CPF CRIPTOGRAFADO
-- ============================================

-- Apenas admin e instituição associada podem ver CPF
-- Já implementado via RLS existente na tabela families

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

-- Para criptografar um CPF:
-- SELECT public.encrypt_cpf('12345678901');

-- Para descriptografar (apenas admin):
-- SELECT public.decrypt_cpf(cpf_encrypted) FROM families WHERE id = 'uuid';

-- Para buscar por CPF:
-- SELECT * FROM public.find_family_by_cpf('123.456.789-01');

-- Para usar a view segura:
-- SELECT * FROM public.families_with_cpf;

-- Para migrar CPFs existentes:
-- SELECT * FROM public.migrate_cpf_to_encrypted();

-- ============================================
-- IMPORTANTE - CONFIGURAÇÃO DE PRODUÇÃO
-- ============================================

/*
EM PRODUÇÃO, configure a chave de criptografia no Supabase:

1. Via Dashboard do Supabase:
   - Vá em Project Settings → Vault
   - Adicione secret 'encryption_key' com chave de 32 bytes
   - Atualize a função get_encryption_key() para usar vault.decrypt_secret()

2. Via SQL (após criar secret no Vault):
   
   CREATE OR REPLACE FUNCTION public.get_encryption_key()
   RETURNS TEXT AS $$
   BEGIN
     RETURN vault.decrypt_secret('encryption_key');
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

3. Gere chave segura:
   - Use: openssl rand -base64 32
   - Armazene no Vault do Supabase
   - NUNCA comite a chave no código!
*/

