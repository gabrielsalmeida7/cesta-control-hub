# Política de Retenção de Dados - Versão Simplificada

**Sistema:** Cesta Control Hub  
**Aplicável a:** Todos os dados pessoais  
**Atualizado em:** Janeiro 2025

---

## 📅 Quanto Tempo Guardamos Seus Dados?

A LGPD determina que dados pessoais só podem ser mantidos pelo tempo necessário para cumprir sua finalidade.

---

## 📊 Tabela de Retenção

| Tipo de Dado | Prazo de Retenção | O que fazemos depois | Base Legal |
|--------------|-------------------|----------------------|------------|
| **Dados Cadastrais** (nome, CPF, telefone, endereço) | Enquanto família estiver ativa + **5 anos** | Excluir manualmente | Obrigação legal (prestação de contas) |
| **Histórico de Entregas** | **5 anos** após última entrega | Manter apenas estatísticas sem identificação | Obrigação legal + legítimo interesse |
| **Consentimentos Assinados** (PDF físico) | **Permanente** | Manter arquivo físico | Comprovação legal (LGPD Art. 8º) |
| **Logs de Auditoria** | **2 anos** | Exclusão automática (Supabase) | Segurança e accountability |
| **Recibos de Entrega** | **5 anos** | Excluir do bucket Supabase | Obrigação legal (comprovação) |
| **Dados de Usuários** (admin/instituições) | Enquanto usuário ativo + **1 ano** | Excluir manualmente | Execução de contrato |

---

## 🔄 Como Funciona?

### Famílias Ativas

**Enquanto a família recebe cestas:**
- ✅ Todos os dados são mantidos
- ✅ Histórico completo disponível
- ✅ Sem exclusão automática

### Famílias Inativas

**Após 5 anos sem receber cestas:**
- ⏰ Sistema identifica famílias inativas há 5+ anos
- 📧 DPO revisa lista anualmente
- 🗑️ Admin exclui dados pelo sistema
- 📊 Apenas estatísticas agregadas permanecem (sem identificação)

**Exemplo:**
- Última entrega: 15/03/2020
- Prazo de retenção: até 15/03/2025
- A partir de 15/03/2025: Dados podem ser excluídos

---

## 🗑️ Como Fazemos a Exclusão?

### Processo Manual (ONG Pequena)

**Revisão Anual (Todo início de ano):**

1. **DPO gera relatório** de famílias inativas há 5+ anos
2. **DPO revisa lista** (verificar se há obrigação legal de manter)
3. **Admin exclui dados** pelo sistema
4. **Documentar exclusão** (quantas famílias, quando, por quem)

### Exclusão no Sistema

**Como fazer:**
- Acessar página de Famílias (Admin)
- Filtrar famílias inativas há 5+ anos
- Selecionar família
- Clicar em "Excluir Permanentemente"
- Confirmar exclusão

**O que é excluído:**
- Nome, CPF, telefone, endereço
- Histórico de entregas com identificação
- Observações

**O que é mantido:**
- Estatísticas agregadas (ex: "25 entregas em 2020")
- Dados anonimizados para relatórios
- Consentimentos físicos assinados (arquivo físico)

---

## 📋 Exceções à Exclusão

### Quando NÃO excluir mesmo após 5 anos:

**1. Processo Judicial em Andamento**
- Se há processo envolvendo a família, manter dados até conclusão

**2. Solicitação de Órgão Público**
- Se MP, Defensoria ou outro órgão solicitar, manter até liberação

**3. Obrigação Legal Específica**
- Prestação de contas para convênios públicos

**Nesses casos:** Documentar motivo da não exclusão

---

## 👤 Solicitação do Titular

### Se a família pedir exclusão antes do prazo:

**Titular pode solicitar:**
- ✅ A qualquer momento, pelo Portal do Titular
- ✅ Por email ao DPO
- ✅ Presencialmente

**Prazo de atendimento:** Até 15 dias úteis

**Processo:**
1. Titular solicita exclusão
2. DPO verifica se há obrigação legal de manter
3. Se não há obrigação: excluir imediatamente
4. Se há obrigação: explicar ao titular o motivo
5. Após fim da obrigação: excluir

**Exemplo de obrigação:**
- "Seu CPF precisa permanecer por 3 anos devido à prestação de contas do convênio público com a prefeitura. Após esse prazo, excluiremos automaticamente."

---

## 📝 Documentação da Retenção

### Registro de Exclusões

Manter planilha simples:

| Data Exclusão | Famílias Excluídas | Motivo | Responsável |
|---------------|-------------------|---------|-------------|
| 15/01/2025 | 12 famílias | Inativas há 5+ anos | DPO (Nome) |
| 20/02/2025 | 1 família | Solicitação do titular | DPO (Nome) |

---

## 🔍 Revisão da Política

### Frequência de Revisão:

- **Anual:** DPO revisa prazos e processos
- **Quando necessário:** Se mudar legislação ou obrigações

### Perguntas para revisão:

1. Os prazos ainda fazem sentido?
2. Há novos tipos de dados coletados?
3. Mudou alguma obrigação legal?
4. O processo de exclusão está funcionando?

---

## ⚖️ Base Legal

Esta política está em conformidade com:

- **LGPD Art. 15:** Término do tratamento de dados
- **LGPD Art. 16:** Eliminação dos dados após término
- **LGPD Art. 18, VI:** Direito do titular à eliminação

**Prazo de 5 anos baseado em:**
- Código Civil Brasileiro (prescrição)
- TCU (Tribunal de Contas - prestação de contas)
- Práticas de mercado para ONGs

---

## ✅ Checklist de Retenção

**Revisar anualmente (início do ano):**

- [ ] DPO gera relatório de famílias inativas há 5+ anos
- [ ] DPO verifica se há obrigação legal de manter alguma
- [ ] Admin exclui famílias aprovadas pelo DPO
- [ ] Documentar exclusões realizadas
- [ ] Verificar se há solicitações pendentes de titulares
- [ ] Revisar prazos (se mudou legislação)

---

## 📞 Dúvidas?

**Contato do DPO:**
- Email: dpo@cestacontrolhub.com.br
- Telefone: (34) 99999-0000

---

## 💡 Resumo em 3 Pontos

1. **Dados são mantidos enquanto necessários** (família ativa + 5 anos)
2. **Exclusão anual** de famílias inativas há 5+ anos
3. **Titular pode pedir exclusão** a qualquer momento

---

**Documento elaborado em conformidade com:**
- Lei nº 13.709/2018 (LGPD) - Art. 15, 16, 18
- Princípio da Necessidade (Art. 6º, III)

