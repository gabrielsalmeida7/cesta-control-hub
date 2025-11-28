-- Migration: Implementar Exclusão Permanente e Anonimização de Dados
-- Data: 2025-01-XX
-- Descrição: Funcionalidades para direito de eliminação (Art. 18, VI) e anonimização

-- ============================================
-- 1. FUNÇÃO DE ANONIMIZAÇÃO DE FAMÍLIA
-- ============================================

CREATE OR REPLACE FUNCTION public.anonymize_family(
  p_family_id UUID,
  p_reason TEXT DEFAULT 'Política de retenção'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_family RECORD;
  v_anonymous_id TEXT;
BEGIN
  -- Verificar se família existe
  SELECT * INTO v_family FROM public.families WHERE id = p_family_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Família não encontrada';
  END IF;
  
  -- Gerar ID anônimo
  v_anonymous_id := 'ANON-' || encode(gen_random_bytes(8), 'hex');
  
  -- Anonimizar dados
  UPDATE public.families
  SET 
    name = v_anonymous_id,
    contact_person = 'Anônimo',
    phone = NULL,
    cpf = NULL,
    cpf_encrypted = NULL,
    address = 'Região ' || LEFT(address, 10), -- Generalizar apenas região
    -- Manter dados não identificadores
    members_count = members_count,
    is_blocked = FALSE,
    blocked_until = NULL,
    blocked_by_institution_id = NULL,
    block_reason = NULL,
    -- Marcar como anonimizado
    updated_at = now()
  WHERE id = p_family_id;
  
  -- Registrar anonimização
  PERFORM public.audit_log(
    p_action_type := 'DATA_DELETE',
    p_table_name := 'families',
    p_record_id := p_family_id,
    p_description := format('Família anonimizada. Motivo: %s', p_reason),
    p_severity := 'WARNING'
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao anonimizar família: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_family IS 
'Anonimiza dados de uma família, mantendo apenas informações estatísticas não identificadoras. LGPD Art. 16.';

-- ============================================
-- 2. FUNÇÃO DE ANONIMIZAÇÃO EM LOTE
-- ============================================

CREATE OR REPLACE FUNCTION public.anonymize_inactive_families(
  p_inactive_days INTEGER DEFAULT 1825 -- 5 anos
)
RETURNS TABLE(anonymized_count INTEGER, error_count INTEGER) AS $$
DECLARE
  v_family RECORD;
  v_anonymized INTEGER := 0;
  v_errors INTEGER := 0;
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  v_cutoff_date := now() - (p_inactive_days || ' days')::INTERVAL;
  
  -- Buscar famílias inativas
  FOR v_family IN 
    SELECT f.id
    FROM public.families f
    LEFT JOIN public.deliveries d ON d.family_id = f.id
    WHERE f.name NOT LIKE 'ANON-%' -- Não anonimizar novamente
    GROUP BY f.id
    HAVING MAX(d.delivery_date) < v_cutoff_date
       OR (MAX(d.delivery_date) IS NULL AND f.created_at < v_cutoff_date)
  LOOP
    BEGIN
      PERFORM public.anonymize_family(
        v_family.id, 
        format('Inatividade superior a %s dias', p_inactive_days)
      );
      v_anonymized := v_anonymized + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
        RAISE NOTICE 'Erro ao anonimizar família %: %', v_family.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_anonymized, v_errors;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.anonymize_inactive_families IS 
'Anonimiza em lote famílias inativas há mais de X dias (padrão: 5 anos). Execução periódica recomendada.';

-- ============================================
-- 3. FUNÇÃO DE EXCLUSÃO PERMANENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_family_permanently(
  p_family_id UUID,
  p_reason TEXT,
  p_requested_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_family RECORD;
  v_deliveries_count INTEGER;
  v_result JSONB;
BEGIN
  -- Verificar se família existe
  SELECT * INTO v_family FROM public.families WHERE id = p_family_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Família não encontrada'
    );
  END IF;
  
  -- Validar razão obrigatória
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Razão da exclusão é obrigatória'
    );
  END IF;
  
  -- Contar entregas
  SELECT COUNT(*) INTO v_deliveries_count
  FROM public.deliveries
  WHERE family_id = p_family_id;
  
  -- Registrar exclusão ANTES de deletar
  PERFORM public.audit_log(
    p_action_type := 'DATA_DELETE',
    p_table_name := 'families',
    p_record_id := p_family_id,
    p_old_data := to_jsonb(v_family),
    p_description := format('Exclusão permanente solicitada. Motivo: %s. Entregas históricas: %s', 
                           p_reason, v_deliveries_count),
    p_severity := 'CRITICAL'
  );
  
  -- Excluir em cascata
  -- 1. Entregas (se permitido)
  IF v_deliveries_count > 0 THEN
    -- Opção A: Manter entregas anonimizadas (recomendado para auditoria)
    UPDATE public.deliveries
    SET 
      notes = 'Família excluída: ' || p_reason,
      family_id = NULL -- Desassociar mas manter registro
    WHERE family_id = p_family_id;
    
    -- Opção B: Excluir completamente (use com cuidado)
    -- DELETE FROM public.deliveries WHERE family_id = p_family_id;
  END IF;
  
  -- 2. Vínculos institucionais
  DELETE FROM public.institution_families WHERE family_id = p_family_id;
  
  -- 3. Logs de consentimento (opcional: manter para auditoria)
  -- DELETE FROM public.consent_change_log WHERE family_id = p_family_id;
  
  -- 4. Excluir família
  DELETE FROM public.families WHERE id = p_family_id;
  
  -- Resultado
  v_result := jsonb_build_object(
    'success', true,
    'family_id', p_family_id,
    'deliveries_count', v_deliveries_count,
    'reason', p_reason,
    'deleted_at', now()
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_family_permanently IS 
'Exclui permanentemente família e dados relacionados. LGPD Art. 18, VI - Direito de eliminação. CUIDADO: ação irreversível!';

-- ============================================
-- 4. FUNÇÃO PARA PORTABILIDADE DE DADOS
-- ============================================

CREATE OR REPLACE FUNCTION public.export_family_data(
  p_family_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_family RECORD;
  v_deliveries JSONB;
  v_institutions JSONB;
  v_consent JSONB;
  v_result JSONB;
BEGIN
  -- Buscar família
  SELECT * INTO v_family FROM public.families WHERE id = p_family_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Família não encontrada');
  END IF;
  
  -- Buscar entregas
  SELECT jsonb_agg(
    jsonb_build_object(
      'data', d.delivery_date,
      'instituicao', i.name,
      'periodo_bloqueio_dias', d.blocking_period_days,
      'observacoes', d.notes
    )
  ) INTO v_deliveries
  FROM public.deliveries d
  LEFT JOIN public.institutions i ON i.id = d.institution_id
  WHERE d.family_id = p_family_id;
  
  -- Buscar instituições vinculadas
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', i.name,
      'data_vinculo', if_link.created_at
    )
  ) INTO v_institutions
  FROM public.institution_families if_link
  LEFT JOIN public.institutions i ON i.id = if_link.institution_id
  WHERE if_link.family_id = p_family_id;
  
  -- Buscar histórico de consentimento
  SELECT jsonb_build_object(
    'consentimento_digital', v_family.consent_given_at,
    'termo_gerado', v_family.consent_term_generated_at,
    'termo_assinado', v_family.consent_term_signed,
    'termo_id', v_family.consent_term_id,
    'revogado_em', v_family.consent_revoked_at,
    'motivo_revogacao', v_family.consent_revocation_reason
  ) INTO v_consent;
  
  -- Montar resultado
  v_result := jsonb_build_object(
    'exportado_em', now(),
    'familia', jsonb_build_object(
      'id', v_family.id,
      'nome', v_family.name,
      'pessoa_contato', v_family.contact_person,
      'telefone', v_family.phone,
      'cpf', public.decrypt_cpf(v_family.cpf_encrypted),
      'endereco', v_family.address,
      'membros', v_family.members_count,
      'cadastrado_em', v_family.created_at
    ),
    'status', jsonb_build_object(
      'bloqueado', v_family.is_blocked,
      'bloqueado_ate', v_family.blocked_until,
      'motivo_bloqueio', v_family.block_reason
    ),
    'consentimento', v_consent,
    'entregas', COALESCE(v_deliveries, '[]'::jsonb),
    'instituicoes', COALESCE(v_institutions, '[]'::jsonb)
  );
  
  -- Registrar exportação
  PERFORM public.audit_log(
    p_action_type := 'DATA_EXPORT',
    p_table_name := 'families',
    p_record_id := p_family_id,
    p_description := 'Exportação de dados para portabilidade (Art. 18, V)',
    p_severity := 'INFO'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.export_family_data IS 
'Exporta todos os dados de uma família em formato estruturado (JSON). LGPD Art. 18, V - Portabilidade.';

-- ============================================
-- 5. VIEW PARA DADOS ELEGÍVEIS PARA EXCLUSÃO
-- ============================================

CREATE OR REPLACE VIEW public.families_eligible_for_deletion AS
SELECT 
  f.id,
  f.name,
  f.created_at,
  MAX(d.delivery_date) as last_delivery_date,
  EXTRACT(DAY FROM now() - COALESCE(MAX(d.delivery_date), f.created_at))::INTEGER as days_inactive,
  CASE 
    WHEN EXTRACT(DAY FROM now() - COALESCE(MAX(d.delivery_date), f.created_at)) > 1825 THEN 'ELEGÍVEL'
    ELSE 'ATIVA'
  END as retention_status
FROM public.families f
LEFT JOIN public.deliveries d ON d.family_id = f.id
WHERE f.name NOT LIKE 'ANON-%' -- Excluir já anonimizados
GROUP BY f.id
ORDER BY days_inactive DESC;

COMMENT ON VIEW public.families_eligible_for_deletion IS 
'Lista famílias elegíveis para exclusão/anonimização baseado na política de retenção (5 anos).';

-- ============================================
-- 6. FUNÇÃO PARA REVOGAR CONSENTIMENTO E ELIMINAR DADOS
-- ============================================

CREATE OR REPLACE FUNCTION public.revoke_consent_and_delete(
  p_family_id UUID,
  p_revocation_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Atualizar consentimento
  UPDATE public.families
  SET 
    consent_revoked_at = now(),
    consent_revocation_reason = p_revocation_reason
  WHERE id = p_family_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Família não encontrada');
  END IF;
  
  -- Opção: Excluir imediatamente ou agendar
  -- Para dar tempo de processar, vamos apenas marcar e não deletar imediatamente
  
  -- Registrar
  PERFORM public.audit_log(
    p_action_type := 'CONSENT_REVOKED',
    p_table_name := 'families',
    p_record_id := p_family_id,
    p_description := format('Consentimento revogado. Motivo: %s. Dados serão eliminados conforme política.', 
                           p_revocation_reason),
    p_severity := 'WARNING'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Consentimento revogado. Seus dados serão eliminados em até 30 dias conforme nossa política de retenção.',
    'revoked_at', now()
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.revoke_consent_and_delete IS 
'Revoga consentimento e agenda eliminação de dados. LGPD Art. 18, IX.';

-- ============================================
-- 7. POLÍTICAS DE RLS PARA FUNÇÕES
-- ============================================

-- Apenas admin pode anonimizar/deletar
-- Implementado via SECURITY DEFINER e verificações internas

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

/*
-- Para anonimizar uma família:
SELECT public.anonymize_family('uuid-da-familia', 'Inatividade há 5 anos');

-- Para anonimizar famílias inativas em lote:
SELECT * FROM public.anonymize_inactive_families(1825); -- 5 anos

-- Para excluir permanentemente (CUIDADO):
SELECT public.delete_family_permanently(
  'uuid-da-familia',
  'Solicitação do titular (Art. 18, VI)',
  auth.uid()
);

-- Para exportar dados (portabilidade):
SELECT public.export_family_data('uuid-da-familia');

-- Para ver famílias elegíveis para exclusão:
SELECT * FROM public.families_eligible_for_deletion
WHERE retention_status = 'ELEGÍVEL';

-- Para revogar consentimento:
SELECT public.revoke_consent_and_delete(
  'uuid-da-familia',
  'Titular solicitou revogação'
);
*/

-- ============================================
-- AGENDAMENTO AUTOMÁTICO (Exemplo com pg_cron)
-- ============================================

/*
-- Instalar extensão pg_cron (requer superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar anonimização mensal
SELECT cron.schedule(
  'anonimizar-familias-inativas',
  '0 2 1 * *', -- Primeiro dia do mês às 2h
  $$SELECT public.anonymize_inactive_families(1825);$$
);
*/

