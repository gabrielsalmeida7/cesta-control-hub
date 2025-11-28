# Análise de Minimização de Dados - LGPD

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Base Legal:** LGPD Art. 6º, III - Princípio da Necessidade  

---

## 1. OBJETIVO

Garantir que apenas dados pessoais estritamente necessários para as finalidades determinadas sejam coletados e tratados, em conformidade com o princípio da minimização (LGPD Art. 6º, III).

## 2. PRINCÍPIO DA MINIMIZAÇÃO

> **Art. 6º, III - necessidade:** limitação do tratamento ao mínimo necessário para a realização de suas finalidades, com abrangência dos dados pertinentes, proporcionais e não excessivos em relação às finalidades do tratamento de dados.

## 3. ANÁLISE POR CATEGORIA DE DADOS

### 3.1. Dados de Famílias Beneficiárias

| Campo | Necessário? | Justificativa | Ação |
|-------|------------|---------------|------|
| **Nome da Família** | ✅ SIM | Identificação básica para distribuição | MANTER |
| **Pessoa de Contato** | ✅ SIM | Comunicação e identificação do titular | MANTER |
| **CPF** | ✅ SIM | Identificação única, prevenção de duplicidade | MANTER (criptografado) |
| **Telefone** | ✅ SIM | Canal de comunicação essencial | MANTER |
| **Endereço** | ⚠️ OPCIONAL | Útil para logística, mas não essencial | TORNAR OPCIONAL |
| **Número de Membros** | ✅ SIM | Determina quantidade de recursos necessários | MANTER |
| **Observações/Notas** | ⚠️ CONDICIONAL | Apenas quando necessário para contexto | REVISAR NECESSIDADE |

**Recomendações:**
- ✅ CPF: Já está sendo implementada criptografia
- ✅ Endereço: Tornar explicitamente opcional no cadastro
- ✅ Observações: Limitar a informações essenciais, sem dados sensíveis desnecessários

### 3.2. Dados de Usuários do Sistema

| Campo | Necessário? | Justificativa | Ação |
|-------|------------|---------------|------|
| **Email** | ✅ SIM | Autenticação e comunicação | MANTER |
| **Senha (hash)** | ✅ SIM | Segurança de acesso | MANTER |
| **Nome Completo** | ✅ SIM | Identificação do usuário | MANTER |
| **Role (função)** | ✅ SIM | Controle de acesso e permissões | MANTER |
| **Instituição vinculada** | ✅ SIM | Segregação de dados por instituição | MANTER |

**Recomendações:**
- ✅ Todos os campos são essenciais
- ✅ Não coletar dados adicionais desnecessários

### 3.3. Dados de Instituições

| Campo | Necessário? | Justificativa | Ação |
|-------|------------|---------------|------|
| **Nome** | ✅ SIM | Identificação da instituição parceira | MANTER |
| **Endereço** | ⚠️ OPCIONAL | Útil para contato, mas não essencial | TORNAR OPCIONAL |
| **Telefone** | ✅ SIM | Canal de comunicação | MANTER |

**Recomendações:**
- ✅ Endereço: Tornar opcional se não for crítico

### 3.4. Dados de Entregas

| Campo | Necessário? | Justificativa | Ação |
|-------|------------|---------------|------|
| **Data de entrega** | ✅ SIM | Registro histórico e controle de bloqueio | MANTER |
| **Família ID** | ✅ SIM | Identificação do beneficiário | MANTER |
| **Instituição ID** | ✅ SIM | Rastreabilidade e transparência | MANTER |
| **Período de bloqueio** | ✅ SIM | Regra de negócio essencial | MANTER |
| **Observações** | ⚠️ CONDICIONAL | Apenas quando necessário | REVISAR |
| **Usuário que entregou** | ✅ SIM | Auditoria e rastreabilidade | MANTER |

**Recomendações:**
- ✅ Observações: Limitar a informações operacionais relevantes

### 3.5. Dados de Fornecedores

| Campo | Necessário? | Justificativa | Ação |
|-------|------------|---------------|------|
| **Nome** | ✅ SIM | Identificação do fornecedor | MANTER |
| **CPF/CNPJ** | ✅ SIM | Obrigação fiscal e identificação única | MANTER |
| **Tipo (PF/PJ)** | ✅ SIM | Classificação necessária | MANTER |
| **Nome de contato** | ✅ SIM | Comunicação | MANTER |
| **Telefone** | ✅ SIM | Canal de comunicação | MANTER |
| **Email** | ⚠️ OPCIONAL | Canal adicional de comunicação | TORNAR OPCIONAL |

**Recomendações:**
- ✅ Email: Tornar opcional (telefone já é suficiente)

## 4. CAMPOS A TORNAR OPCIONAIS

### 4.1. Implementação

```sql
-- Remover constraint NOT NULL de campos opcionais
ALTER TABLE public.families 
ALTER COLUMN address DROP NOT NULL;

ALTER TABLE public.institutions 
ALTER COLUMN address DROP NOT NULL;

ALTER TABLE public.suppliers 
ALTER COLUMN contact_email DROP NOT NULL;
```

### 4.2. Atualizar Interface

- ✅ Remover asterisco (*) de campos opcionais
- ✅ Adicionar texto explicativo "opcional"
- ✅ Não bloquear envio de formulário se campo opcional vazio

## 5. DADOS QUE NÃO DEVEM SER COLETADOS

❌ **PROIBIDOS de coletar sem justificativa específica:**

- Dados sensíveis (origem racial/étnica, convicções religiosas, opiniões políticas) - LGPD Art. 5º, II
- Estado de saúde (salvo necessidade específica documentada)
- Dados biométricos (impressão digital, foto facial)
- Dados de crianças/adolescentes sem consentimento dos responsáveis
- Histórico de navegação ou comportamento online
- Dados de redes sociais
- Dados financeiros detalhados (salário, patrimônio)
- Informações sobre família extended além do necessário

## 6. COLETA PROGRESSIVA

### 6.1. Princípio

Coletar dados em etapas, apenas quando necessário:

**Etapa 1 - Cadastro Inicial (Mínimo):**
- Nome da família
- Pessoa de contato
- Telefone
- Número de membros
- Consentimento

**Etapa 2 - Quando Necessário:**
- CPF (para prevenção de duplicidade)
- Endereço (se necessário para logística)

**Etapa 3 - Operacional:**
- Observações específicas (apenas quando relevante)

## 7. REVISÃO DE FORMULÁRIOS

### 7.1. Checklist para Novos Campos

Antes de adicionar um novo campo, responder:

1. ❓ Este dado é absolutamente necessário para a finalidade?
2. ❓ Conseguimos atingir o mesmo objetivo sem este dado?
3. ❓ Existe uma alternativa menos invasiva?
4. ❓ A coleta está documentada na Política de Privacidade?
5. ❓ Temos base legal para coletar este dado?
6. ❓ O titular será informado sobre a finalidade?
7. ❓ Quanto tempo manteremos este dado?

**Regra:** Se a resposta a 1, 4, 5, 6 não for "SIM", NÃO coletar.

## 8. BOAS PRÁTICAS IMPLEMENTADAS

✅ **Já implementadas:**
- Campos opcionais claramente marcados
- CPF opcional (obrigatório apenas para controle de duplicidade)
- Criptografia de dados sensíveis (CPF)
- Consentimento explícito antes da coleta
- Política de privacidade transparente

🔄 **A implementar:**
- Tornar endereço opcional em instituições
- Limitar tamanho de campo "observações"
- Revisar campos de observações para evitar dados desnecessários

## 9. TREINAMENTO DE EQUIPE

### 9.1. Orientações para Cadastradores

**DO:**
- ✅ Coletar apenas dados solicitados no formulário
- ✅ Perguntar apenas o necessário
- ✅ Respeitar quando titular não quiser fornecer dados opcionais

**DON'T:**
- ❌ Anotar informações extras em campos de observação
- ❌ Coletar dados "por precaução" ou "pode ser útil depois"
- ❌ Solicitar documentos desnecessários
- ❌ Fazer cópias de documentos sem necessidade

## 10. AUDITORIA DE MINIMIZAÇÃO

### 10.1. Periodicidade

**Trimestral:** Revisar campos coletados

**Anual:** Análise completa de todos os dados

### 10.2. Perguntas-Chave

- Quais dados coletamos?
- Quais são realmente necessários?
- Algum dado pode ser removido?
- Algum campo pode ser tornado opcional?
- Estamos coletando dados que não usamos?

## 11. RELATÓRIO DE MINIMIZAÇÃO

### Template

```
RELATÓRIO DE MINIMIZAÇÃO DE DADOS

Período: [Data inicial] a [Data final]

1. DADOS ANALISADOS
   - Total de campos em análise: [X]
   - Campos essenciais: [Y]
   - Campos opcionais: [Z]
   - Campos removidos: [W]

2. AÇÕES REALIZADAS
   - [ ] Campo X tornado opcional
   - [ ] Campo Y removido
   - [ ] Formulário Z simplificado

3. IMPACTO
   - Redução de dados coletados: [%]
   - Melhoria na experiência do titular: [Descrição]

4. PRÓXIMAS AÇÕES
   - [ ] Ação 1
   - [ ] Ação 2

Responsável: [Nome]
Data: [DD/MM/AAAA]
```

## 12. CONFORMIDADE

Esta análise atende:
- **LGPD Art. 6º, III** - Princípio da necessidade
- **LGPD Art. 6º, IV** - Princípio do livre acesso
- **LGPD Art. 6º, VI** - Princípio da transparência
- **LGPD Art. 18, I e II** - Direito de confirmação e acesso

## 13. COMPROMISSO

O Cesta Control Hub compromete-se a:

1. ✅ Coletar apenas dados estritamente necessários
2. ✅ Revisar periodicamente a necessidade de cada campo
3. ✅ Tornar opcional todo dado não essencial
4. ✅ Eliminar dados que deixarem de ser necessários
5. ✅ Treinar equipe sobre minimização

---

**Próxima Revisão:** Trimestral (Abril 2025)  
**Responsável:** DPO + Equipe de Desenvolvimento  
**Aprovado por:** [Nome do Responsável]  
**Data:** Janeiro 2025

