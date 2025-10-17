# BUSINESS_RULES.md

## Regras de Negócio - Cesta Control Hub

**Versão:** 1.0.0  
**Última Atualização:** Janeiro 2025  
**Domínio:** Gestão de Distribuição de Cestas Básicas

---

## 🎯 Visão Geral

Este documento define todas as regras de negócio do sistema Cesta Control Hub, incluindo validações, permissões, fluxos de trabalho e restrições que garantem o funcionamento correto do sistema de distribuição de cestas básicas.

---

## 👥 USUÁRIOS E ROLES

### 1. **Administrador (Admin)**

- **Permissões:**
  - ✅ Acesso total ao sistema
  - ✅ Gerenciar todas as instituições
  - ✅ Gerenciar todas as famílias
  - ✅ Desbloquear famílias manualmente
  - ✅ Visualizar relatórios gerais
  - ✅ Registrar entregas para qualquer instituição
- **Restrições:**
  - ❌ Não pode alterar dados de outras instituições diretamente
  - ❌ Deve justificar desbloqueios manuais

### 2. **Instituição (Institution)**

- **Permissões:**
  - ✅ Gerenciar apenas suas próprias famílias
  - ✅ Registrar entregas para suas famílias
  - ✅ Visualizar relatórios da própria instituição
  - ✅ Editar dados da própria instituição
- **Restrições:**
  - ❌ Não pode desbloquear famílias
  - ❌ Não pode ver dados de outras instituições
  - ❌ Não pode registrar entregas para famílias não vinculadas

---

## 🏢 GESTÃO DE INSTITUIÇÕES

### 1. **Criação de Instituição**

- **Campos Obrigatórios:**
  - Nome (mínimo 3 caracteres)
  - Endereço
  - Telefone (formato válido)
- **Validações:**
  - Nome único no sistema
  - Telefone no formato brasileiro
  - Endereço não pode estar vazio

### 2. **Edição de Instituição**

- **Permitido:**
  - Atualizar todos os campos
  - Alterar dados de contato
- **Restrições:**
  - Apenas admin pode editar qualquer instituição
  - Instituição pode editar apenas seus próprios dados

### 3. **Exclusão de Instituição**

- **Condições:**
  - Não pode ter famílias vinculadas
  - Não pode ter entregas registradas
  - Apenas admin pode excluir

---

## 👨‍👩‍👧‍👦 GESTÃO DE FAMÍLIAS

### 1. **Criação de Família**

- **Campos Obrigatórios:**
  - Nome da família
  - Pessoa de contato
  - Número de membros (mínimo 1)
  - Telefone (opcional)
- **Validações:**
  - CPF único no sistema (se fornecido)
  - Número de membros deve ser positivo
  - Nome não pode estar vazio

### 2. **Associação Família-Instituição**

- **Regras:**
  - Uma família pode estar vinculada a múltiplas instituições
  - Uma instituição pode atender múltiplas famílias
  - Associação é obrigatória para entregas
  - Apenas admin pode criar associações

### 3. **Status da Família**

- **Estados:**
  - **Ativa:** Pode receber cestas
  - **Bloqueada:** Não pode receber cestas
- **Transições:**
  - Ativa → Bloqueada: Automática após entrega
  - Bloqueada → Ativa: Manual (admin) ou automática (expiração)

---

## 📦 SISTEMA DE BLOQUEIO

### 1. **Bloqueio Automático**

- **Trigger:** Após registro de entrega
- **Duração:** Configurável (15, 30, 45, 60, 90 dias)
- **Ação:** Família fica bloqueada para todas as instituições
- **Registros:**
  - Data do bloqueio
  - Data de expiração
  - Instituição que fez a entrega
  - Motivo: "Recebeu cesta básica"

### 2. **Desbloqueio Manual**

- **Quem pode:** Apenas administradores
- **Quando:** A qualquer momento
- **Justificativa:** Obrigatória
- **Registros:**
  - Data do desbloqueio
  - Usuário que desbloqueou
  - Motivo do desbloqueio

### 3. **Desbloqueio Automático**

- **Trigger:** Data de expiração atingida
- **Ação:** Status volta para "Ativa"
- **Notificação:** Opcional (futuro)

---

## 🚚 GESTÃO DE ENTREGAS

### 1. **Registro de Entrega**

- **Pré-condições:**
  - Família deve estar ativa
  - Família deve estar vinculada à instituição
  - Instituição deve ter cestas disponíveis
- **Dados Obrigatórios:**
  - Família
  - Instituição
  - Quantidade de cestas
  - Período de bloqueio
- **Dados Opcionais:**
  - Itens adicionais
  - Observações
  - Data da entrega (padrão: hoje)

### 2. **Validações de Entrega**

- **Família Bloqueada:**
  - ❌ Não permite entrega
  - Mostra data de desbloqueio
  - Sugere contatar admin
- **Família Não Vinculada:**
  - ❌ Não permite entrega
  - Sugere vincular família primeiro
- **Estoque Insuficiente:**
  - ❌ Não permite entrega
  - Mostra quantidade disponível

### 3. **Consequências da Entrega**

- **Automáticas:**
  - Família é bloqueada
  - Data de bloqueio é calculada
  - Estoque de cestas é reduzido
  - Histórico é registrado
- **Manuais:**
  - Observações são salvas
  - Usuário responsável é registrado

---

## 📊 CONTROLE DE ESTOQUE

### 1. **Cestas Básicas**

- **Controle:** Por instituição
- **Redução:** Automática após entrega
- **Reposição:** Manual (admin)
- **Validação:** Não pode ficar negativo

### 2. **Itens Adicionais**

- **Controle:** Texto livre
- **Formato:** Lista separada por vírgula
- **Exemplo:** "Leite (2L), Arroz (5kg), Feijão (1kg)"

---

## 🔐 SEGURANÇA E PERMISSÕES

### 1. **Row Level Security (RLS)**

- **Admin:** Acesso total a todos os dados
- **Instituição:** Acesso apenas aos próprios dados
- **Implementação:** Via políticas do Supabase

### 2. **Validações de Frontend**

- **Role-based UI:** Elementos mostrados conforme permissão
- **Validação de Ações:** Verificação antes de executar
- **Feedback:** Mensagens claras sobre restrições

### 3. **Auditoria**

- **Registros Obrigatórios:**
  - Quem fez a ação
  - Quando foi feita
  - O que foi alterado
- **Logs:** Todas as operações críticas

---

## 📈 RELATÓRIOS E MÉTRICAS

### 1. **Dashboard Admin**

- **Métricas:**
  - Total de instituições
  - Total de famílias
  - Total de entregas
  - Famílias bloqueadas
- **Período:** Mês atual

### 2. **Dashboard Instituição**

- **Métricas:**
  - Famílias atendidas
  - Entregas do mês
  - Famílias bloqueadas pela instituição
  - Total de entregas históricas
- **Período:** Mês atual

### 3. **Relatórios Detalhados**

- **Disponíveis:**
  - Entregas por período
  - Famílias mais atendidas
  - Instituições mais ativas
  - Análise de bloqueios

---

## ⚠️ VALIDAÇÕES CRÍTICAS

### 1. **Integridade de Dados**

- **CPF:** Único no sistema
- **Email:** Único no sistema
- **Telefone:** Formato válido
- **Datas:** Não podem ser futuras (exceto bloqueio)

### 2. **Regras de Negócio**

- **Família Bloqueada:** Não pode receber nova entrega
- **Período de Bloqueio:** Mínimo 15 dias, máximo 90 dias
- **Membros da Família:** Mínimo 1, máximo 20
- **Cestas por Entrega:** Mínimo 1, máximo 5

### 3. **Consistência**

- **Associação:** Família deve estar vinculada para entrega
- **Estoque:** Não pode ficar negativo
- **Bloqueio:** Data de expiração deve ser futura

---

## 🔄 FLUXOS DE TRABALHO

### 1. **Fluxo de Entrega Normal**

```
1. Instituição seleciona família vinculada
2. Sistema verifica se família está ativa
3. Sistema verifica estoque disponível
4. Instituição registra entrega
5. Sistema bloqueia família automaticamente
6. Sistema reduz estoque
7. Sistema registra histórico
```

### 2. **Fluxo de Desbloqueio Manual**

```
1. Admin identifica família bloqueada
2. Admin justifica necessidade do desbloqueio
3. Sistema registra desbloqueio
4. Família volta ao status ativo
5. Sistema registra auditoria
```

### 3. **Fluxo de Associação Família-Instituição**

```
1. Admin cria família
2. Admin vincula família a instituição(ões)
3. Instituição pode ver família em suas listas
4. Instituição pode registrar entregas
```

---

## 🚨 CENÁRIOS DE ERRO

### 1. **Família Já Bloqueada**

- **Erro:** "Família está bloqueada até [data]"
- **Solução:** Aguardar expiração ou contatar admin

### 2. **Família Não Vinculada**

- **Erro:** "Família não está vinculada a esta instituição"
- **Solução:** Admin deve vincular família primeiro

### 3. **Estoque Insuficiente**

- **Erro:** "Estoque insuficiente. Disponível: [quantidade]"
- **Solução:** Reduzir quantidade ou repor estoque

### 4. **CPF Duplicado**

- **Erro:** "CPF já cadastrado no sistema"
- **Solução:** Verificar família existente ou usar CPF diferente

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Antes de Registrar Entrega:

- [ ] Família está ativa?
- [ ] Família está vinculada à instituição?
- [ ] Estoque suficiente?
- [ ] Dados da entrega preenchidos?

### Antes de Desbloquear Família:

- [ ] Usuário é admin?
- [ ] Justificativa fornecida?
- [ ] Família realmente está bloqueada?

### Antes de Vincular Família:

- [ ] Família existe?
- [ ] Instituição existe?
- [ ] Associação não é duplicada?

---

## 🔗 DOCUMENTAÇÃO RELACIONADA

- **📄 [MVP_STATUS.md](./MVP_STATUS.md)** - Estado atual do MVP
- **📄 [FRONTEND_TASKS.md](./FRONTEND_TASKS.md)** - Implementação frontend
- **📄 [BACKEND_TASKS.md](./BACKEND_TASKS.md)** - Implementação backend
- **📄 [DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Schema do banco
- **📄 [API_INTEGRATION.md](./API_INTEGRATION.md)** - Padrões de API

---

**Importante:** Todas as regras de negócio devem ser implementadas tanto no frontend (validações) quanto no backend (constraints e triggers) para garantir a integridade dos dados.
