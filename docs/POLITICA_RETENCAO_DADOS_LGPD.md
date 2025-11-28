# Política de Retenção de Dados Pessoais - LGPD

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Base Legal:** LGPD Art. 15 e 16  

---

## 1. OBJETIVO

Estabelecer prazos de retenção de dados pessoais conforme as finalidades de tratamento e obrigações legais, garantindo conformidade com a LGPD.

## 2. PRINCÍPIOS

- **Necessidade:** Manter apenas dados necessários
- **Finalidade:** Reter apenas pelo tempo necessário para a finalidade
- **Conformidade Legal:** Atender prazos legais obrigatórios
- **Minimização:** Reduzir dados ao essencial
- **Transparência:** Informar titulares sobre prazos

## 3. PRAZOS DE RETENÇÃO

### 3.1. Dados de Famílias Beneficiárias

| Tipo de Dado | Prazo de Retenção | Justificativa | Após o Prazo |
|--------------|-------------------|---------------|--------------|
| **Dados cadastrais** (nome, endereço, telefone) | Enquanto vínculo ativo + 5 anos | Prestação de contas, auditoria pública | Anon

imizar |
| **CPF** | Enquanto vínculo ativo + 5 anos | Identificação única, prevenção de duplicidade | Eliminar |
| **Histórico de entregas** | 5 anos após última entrega | Transparência de políticas públicas (Lei 12.527/2011) | Anonimizar |
| **Consentimento** | Enquanto vínculo ativo + 5 anos | Comprovação legal de base legal | Anonimizar |
| **Observações/Notas** | Mesma data do registro relacionado | Contexto da operação | Eliminar |

### 3.2. Dados de Usuários do Sistema

| Tipo de Dado | Prazo de Retenção | Justificativa | Após o Prazo |
|--------------|-------------------|---------------|--------------|
| **Credenciais de acesso** | Enquanto usuário ativo + 1 ano | Segurança, auditoria | Eliminar |
| **Dados profissionais** | Enquanto usuário ativo + 2 anos | Vínculo empregatício | Eliminar |
| **Logs de auditoria** | 5 anos | LGPD Art. 37 | Eliminar |

### 3.3. Dados de Instituições

| Tipo de Dado | Prazo de Retenção | Justificativa | Após o Prazo |
|--------------|-------------------|---------------|--------------|
| **Dados cadastrais** | Enquanto parceria ativa + 5 anos | Transparência, prestação de contas | Anonimizar |
| **Histórico operacional** | 5 anos | Auditoria, relatórios | Anonimizar |

### 3.4. Dados de Fornecedores

| Tipo de Dado | Prazo de Retenção | Justificativa | Após o Prazo |
|--------------|-------------------|---------------|--------------|
| **Dados cadastrais** (nome, CPF/CNPJ) | Enquanto relação comercial + 5 anos | Obrigações fiscais e tributárias | Eliminar |
| **Histórico de transações** | 5 anos | Legislação fiscal | Anonimizar |

### 3.5. Documentos e Recibos

| Tipo de Dado | Prazo de Retenção | Justificativa | Após o Prazo |
|--------------|-------------------|---------------|--------------|
| **Recibos de entrega** | 5 anos | Comprovação, auditoria | Anonimizar |
| **Termos de consentimento** | 5 anos após revogação | Comprovação legal | Arquivar |

## 4. EXCEÇÕES

### 4.1. Retenção Estendida

Dados podem ser retidos além dos prazos estabelecidos quando:

- **Ordem judicial:** Determinação de autoridade competente
- **Investigação:** Em curso (criminal, administrativa)
- **Litígio:** Processo judicial pendente
- **Obrigação legal:** Norma específica exigir prazo maior
- **Consentimento específico:** Titular autorizar expressamente

**Registro:** Toda retenção estendida deve ser documentada com justificativa.

### 4.2. Exclusão Antecipada

Dados devem ser eliminados antes do prazo quando:

- Finalidade alcançada antecipadamente
- Consentimento revogado (quando for a base legal)
- Solicitação do titular (direito de eliminação)
- Dados tornaram-se desnecessários

## 5. PROCESSO DE ELIMINAÇÃO/ANONIMIZAÇÃO

### 5.1. Anonimização

**Quando:** Dados históricos necessários para estatísticas

**Como:**
- Remover identificadores diretos (nome, CPF, endereço)
- Generalizar dados (ex: "região X" ao invés de endereço específico)
- Agregação (ex: "50 entregas" sem identificar famílias)
- Garantir impossibilidade de reidentificação

**Exemplo:**
```
ANTES: Família Silva, CPF 123.456.789-00, Rua A 123, recebeu cesta em 15/01/2025
APÓS:  Família [ID-HASH], região Centro, recebeu cesta em 01/2025
```

### 5.2. Eliminação Completa

**Quando:** Dados não são mais necessários

**Como:**
- Exclusão física do banco de dados
- Remoção de backups
- Destruição de documentos físicos (trituração)
- Certificado de destruição (quando aplicável)

**Registro:** Manter log de eliminação (sem incluir os dados eliminados)

## 6. AUTOMAÇÃO

### 6.1. Rotina Automatizada

```sql
-- Exemplo: Função para identificar dados elegíveis para exclusão
CREATE OR REPLACE FUNCTION identify_data_for_retention()
RETURNS TABLE(
  table_name TEXT,
  record_id UUID,
  retention_action TEXT,
  days_since_inactive INTEGER
) AS $$
BEGIN
  -- Famílias inativas há mais de 5 anos
  RETURN QUERY
  SELECT 
    'families'::TEXT,
    f.id,
    'ANONYMIZE'::TEXT,
    EXTRACT(DAY FROM now() - f.updated_at)::INTEGER
  FROM families f
  LEFT JOIN deliveries d ON d.family_id = f.id
  GROUP BY f.id
  HAVING MAX(d.delivery_date) < (now() - INTERVAL '5 years')
     OR (MAX(d.delivery_date) IS NULL AND f.created_at < (now() - INTERVAL '5 years'));
END;
$$ LANGUAGE plpgsql;
```

### 6.2. Agendamento

- **Frequência:** Mensal
- **Horário:** Madrugada (menor uso do sistema)
- **Responsável:** Equipe de TI + DPO
- **Aprovação:** DPO deve aprovar antes da execução

## 7. RELATÓRIOS

### 7.1. Relatório Mensal de Retenção

**Conteúdo:**
- Quantidade de registros analisados
- Quantidade anonimizada
- Quantidade eliminada
- Exceções aplicadas
- Próximas ações previstas

**Destinatário:** DPO e Diretoria

### 7.2. Relatório Anual para ANPD

**Conteúdo:**
- Política de retenção aplicada
- Estatísticas de eliminação/anonimização
- Alterações na política
- Incidentes relacionados

**Prazo:** Quando solicitado pela ANPD

## 8. RESPONSABILIDADES

| Função | Responsabilidade |
|--------|------------------|
| **DPO** | Aprovar eliminações, revisar política |
| **TI** | Executar eliminações, automatizar processo |
| **Jurídico** | Validar conformidade legal |
| **Gestores** | Identificar dados desnecessários |

## 9. COMUNICAÇÃO AOS TITULARES

Titulares devem ser informados sobre:
- Prazos de retenção (via Política de Privacidade)
- Direito de solicitar eliminação antecipada
- Processo de eliminação/anonimização

## 10. REVISÃO DA POLÍTICA

- **Periodicidade:** Anual
- **Responsável:** DPO
- **Aprovação:** Diretoria
- **Gatilhos para revisão extraordinária:**
  - Mudança na legislação
  - Nova finalidade de tratamento
  - Determinação da ANPD
  - Incidente de segurança

## 11. DOCUMENTAÇÃO

### 11.1. Registros Obrigatórios

- Data da eliminação/anonimização
- Tipo de dados afetados
- Quantidade de registros
- Método utilizado
- Responsável pela execução
- Aprovação do DPO

### 11.2. Retenção dos Registros

Os próprios registros de eliminação devem ser mantidos por 10 anos.

## 12. QUADRO RESUMO

| Categoria | Dados Ativos | Após Inatividade | Método |
|-----------|--------------|------------------|--------|
| Famílias | Ilimitado | +5 anos → Anonimizar | Auto |
| Usuários | Ilimitado | +1 ano → Eliminar | Manual |
| Instituições | Ilimitado | +5 anos → Anonimizar | Auto |
| Logs Auditoria | 5 anos | N/A → Eliminar | Auto |
| Recibos | 5 anos | N/A → Anonimizar | Auto |

## 13. CONFORMIDADE LGPD

Esta política atende:
- **Art. 15:** Término do tratamento
- **Art. 16:** Eliminação após término da finalidade
- **Art. 6º, III:** Princípio da necessidade
- **Art. 18, VI:** Direito de eliminação do titular

---

**IMPORTANTE:** Dados anonimizados de forma irreversível NÃO são considerados dados pessoais pela LGPD e podem ser mantidos indefinidamente para fins estatísticos.

**Aprovado por:** [Nome do Responsável]  
**Data de Aprovação:** Janeiro 2025  
**Próxima Revisão:** Janeiro 2026

