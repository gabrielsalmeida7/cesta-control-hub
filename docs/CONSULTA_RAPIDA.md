# 📚 CONSULTA RÁPIDA - Cesta Control Hub
## Sistema Completo de Gestão de Cestas Básicas

**Versão:** 1.0.0  
**Última Atualização:** Janeiro 2025  
**Status MVP:** 90% completo (bloqueado por RLS - pode ser desabilitado temporariamente)

---

## 🎯 VISÃO GERAL DO SISTEMA

### Objetivo
Sistema web para gerenciar distribuição de cestas básicas em instituições comunitárias, prevenindo duplicação de benefícios através de bloqueio automático.

### Stack Tecnológico
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **Estado:** React Query (TanStack Query)
- **Roteamento:** React Router DOM
- **Formulários:** React Hook Form + Zod

---

## 👥 ROLES E PERMISSÕES

### 1. ADMINISTRADOR (Admin)
**Permissões:**
- ✅ Acesso total ao sistema
- ✅ Gerenciar todas as instituições
- ✅ Gerenciar todas as famílias
- ✅ Desbloquear famílias manualmente (único que pode)
- ✅ Visualizar relatórios gerais
- ✅ Registrar entregas para qualquer instituição
- ✅ Cadastrar instituições e fornecer login

**Restrições:**
- ❌ Não pode alterar dados de outras instituições diretamente
- ❌ Deve justificar desbloqueios manuais

**Rotas:**
- `/` - Dashboard Admin
- `/institutions` - Gerenciar instituições
- `/families` - Gerenciar famílias
- `/delivery` - Registrar entregas
- `/reports` - Relatórios globais

### 2. INSTITUIÇÃO (Institution)
**Permissões:**
- ✅ Gerenciar apenas suas próprias famílias
- ✅ Cadastrar novas famílias (vinculando automaticamente à própria instituição)
- ✅ Registrar entregas para suas famílias vinculadas
- ✅ Visualizar relatórios da própria instituição
- ✅ Editar dados da própria instituição
- ✅ Vincular famílias à própria instituição (se família não tiver vínculo)

**Restrições:**
- ❌ Não pode desbloquear famílias
- ❌ Não pode ver dados de outras instituições
- ❌ Não pode registrar entregas para famílias não vinculadas
- ❌ Não pode vincular famílias que já estão vinculadas a outra instituição

**Rotas:**
- `/institution/dashboard` - Dashboard Institucional
- `/institution/families` - Famílias vinculadas
- `/institution/delivery` - Registrar entregas
- `/institution/reports` - Relatórios da instituição

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Fluxo de Autenticação
```
Login → Supabase Auth → Profile Fetch → Role-based Redirect
  ↓
Admin → / (Dashboard Admin)
  ↓
Institution → /institution/dashboard
```

**Problema Atual:** RLS causa timeout de 106 segundos  
**Solução:** Desabilitar RLS temporariamente (ver `docs/RLS_POLICY_FIX.md`)

### 2. Fluxo de Entrega de Cesta
```
1. Instituição seleciona família vinculada
2. Sistema verifica se família está ativa (não bloqueada)
3. Sistema verifica estoque disponível (se usar itens do estoque)
4. Instituição registra entrega
5. Sistema bloqueia família automaticamente (via trigger SQL)
6. Sistema reduz estoque (se usar itens do estoque)
7. Sistema registra histórico
```

### 3. Fluxo de Bloqueio Automático
```
Entrega registrada → Trigger SQL (on_delivery_created)
  ↓
Função update_family_blocking() executada
  ↓
Família marcada como bloqueada
  ↓
blocked_until = delivery_date + blocking_period_days
  ↓
Família não pode receber nova entrega até blocked_until
```

**Períodos de Bloqueio:** 7, 15, 20, 30 ou 45 dias (configurável)

### 4. Fluxo de Desbloqueio Manual
```
Admin identifica família bloqueada
  ↓
Admin justifica necessidade do desbloqueio
  ↓
Sistema registra desbloqueio
  ↓
Família volta ao status ativo
  ↓
Sistema registra auditoria
```

### 5. Fluxo de Cadastro de Família
```
Admin cadastra família:
  - Família criada na tabela families
  - Permanece "desvinculada" (sem entrada em institution_families)
  - Admin pode vincular manualmente depois

Instituição cadastra família:
  - Família criada na tabela families
  - Entrada criada automaticamente em institution_families
  - Família vinculada à instituição que cadastrou
```

### 6. Fluxo de Associação Família-Instituição
```
Cenário 1: Família Encontrada e Desvinculada
  → Sistema permite vincular

Cenário 2: Família Encontrada e JÁ VINCULADA
  → Erro: "Família já está sendo atendida por [Nome da Instituição]"

Cenário 3: Família Não Encontrada
  → Opção de cadastrar nova família

Cenário 4: Família Já Vinculada à Própria Instituição
  → Mensagem: "Família já está na lista"
```

---

## 📦 REGRAS DE NEGÓCIO CRÍTICAS

### 1. Sistema de Bloqueio
- **Regra Principal:** Uma família só pode estar vinculada a UMA instituição
- **Bloqueio Automático:** Após entrega, família bloqueada por período configurável
- **Bloqueio Global:** Família bloqueada não pode receber cesta de NENHUMA instituição
- **Desbloqueio:** Apenas admin pode desbloquear manualmente (com justificativa)
- **Desbloqueio Automático:** Quando `blocked_until` expira

### 2. Validações de Entrega
- ❌ Família bloqueada → Não permite entrega
- ❌ Família não vinculada → Não permite entrega
- ❌ Família vinculada a outra instituição → Não permite entrega
- ❌ Estoque insuficiente → Não permite saída
- ✅ Família ativa + vinculada + estoque OK → Permite entrega

### 3. Gestão de Famílias
- **CPF:** Único no sistema (se fornecido)
- **Membros:** Mínimo 1, máximo 20
- **Vínculo:** Uma família só pode estar vinculada a UMA instituição
- **Criação por Instituição:** Vinculação automática à instituição que cadastrou

### 4. Gestão de Instituições
- **Nome:** Único no sistema
- **Exclusão:** Não pode ter famílias vinculadas ou entregas registradas
- **Edição:** Admin pode editar qualquer instituição; Instituição pode editar apenas seus próprios dados

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais

#### 1. `institutions` - Instituições
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL, UNIQUE)
- `address` (TEXT)
- `phone` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 2. `families` - Famílias
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `contact_person` (TEXT, NOT NULL)
- `phone` (TEXT)
- `cpf` (TEXT, UNIQUE, opcional)
- `address` (TEXT)
- `members_count` (INT, DEFAULT 1)
- `is_blocked` (BOOLEAN, DEFAULT FALSE)
- `blocked_until` (TIMESTAMPTZ)
- `blocked_by_institution_id` (UUID, FK → institutions)
- `block_reason` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 3. `profiles` - Perfis de Usuários
- `id` (UUID, PK, FK → auth.users)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT, NOT NULL)
- `role` (user_role ENUM: 'admin' | 'institution')
- `institution_id` (UUID, FK → institutions, NULL para admin)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 4. `deliveries` - Entregas
- `id` (UUID, PK)
- `delivery_date` (TIMESTAMPTZ, DEFAULT now())
- `family_id` (UUID, FK → families)
- `institution_id` (UUID, FK → institutions)
- `blocking_period_days` (INT, DEFAULT 30)
- `notes` (TEXT)
- `delivered_by_user_id` (UUID, FK → auth.users)
- `created_at` (TIMESTAMPTZ)

#### 5. `institution_families` - Associação Família-Instituição
- `institution_id` (UUID, PK, FK → institutions)
- `family_id` (UUID, PK, FK → families)
- `created_at` (TIMESTAMPTZ)

### Tabelas de Fornecedores e Estoque

#### 6. `suppliers` - Fornecedores
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `document` (TEXT, UNIQUE se não NULL) - CPF ou CNPJ
- `supplier_type` (TEXT, CHECK: 'PF' | 'PJ')
- `contact_name`, `contact_phone`, `contact_email` (TEXT)
- `address`, `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 7. `products` - Produtos
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL, UNIQUE case-insensitive)
- `unit` (TEXT, NOT NULL) - kg, litros, unidades, etc.
- `description` (TEXT)
- `is_active` (BOOLEAN, DEFAULT true) - Soft delete
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 8. `inventory` - Estoque por Instituição
- `id` (UUID, PK)
- `institution_id` (UUID, FK → institutions)
- `product_id` (UUID, FK → products)
- `quantity` (DECIMAL(10,2), DEFAULT 0)
- `last_movement_date` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- **UNIQUE:** (institution_id, product_id)

#### 9. `stock_movements` - Movimentações de Estoque
- `id` (UUID, PK)
- `institution_id` (UUID, FK → institutions)
- `product_id` (UUID, FK → products)
- `movement_type` (TEXT, CHECK: 'ENTRADA' | 'SAIDA')
- `quantity` (DECIMAL(10,2), NOT NULL)
- `supplier_id` (UUID, FK → suppliers, NULL para SAIDA)
- `delivery_id` (UUID, FK → deliveries, NULL para ENTRADA)
- `movement_date` (TIMESTAMPTZ, DEFAULT now())
- `notes` (TEXT)
- `created_by_user_id` (UUID, FK → auth.users)
- `created_at` (TIMESTAMPTZ)

#### 10. `receipts` - Recibos Gerados
- `id` (UUID, PK)
- `receipt_type` (TEXT, CHECK: 'STOCK_ENTRY' | 'STOCK_EXIT' | 'DELIVERY')
- `institution_id` (UUID, FK → institutions)
- `reference_id` (UUID) - stock_movement_id ou delivery_id
- `file_path` (TEXT) - Caminho no storage
- `file_url` (TEXT) - URL pública
- `generated_at` (TIMESTAMPTZ, DEFAULT now())
- `generated_by_user_id` (UUID, FK → auth.users)

### Triggers e Funções SQL

#### Trigger: `on_delivery_created`
- **Quando:** Após INSERT em `deliveries`
- **Ação:** Chama `update_family_blocking()`
- **Resultado:** Bloqueia família automaticamente

#### Função: `update_family_blocking()`
- Atualiza `is_blocked = true`
- Calcula `blocked_until = delivery_date + blocking_period_days`
- Registra `blocked_by_institution_id`
- Define `block_reason = 'Recebeu cesta básica'`

#### Trigger: `trigger_update_inventory_on_movement`
- **Quando:** Após INSERT em `stock_movements`
- **Ação:** Chama `update_inventory_on_movement()`
- **Resultado:** Atualiza estoque automaticamente
- **Validação:** Impede saída se estoque insuficiente

#### Função: `update_inventory_on_movement()`
- **ENTRADA:** Soma quantidade ao estoque
- **SAIDA:** Subtrai quantidade (valida estoque suficiente)
- Atualiza `last_movement_date`
- Cria registro em `inventory` se não existir

---

## 🔐 SISTEMA DE AUTENTICAÇÃO

### Fluxo de Login
1. Usuário insere credenciais
2. `useAuth.signIn()` chama Supabase Auth
3. Supabase retorna sessão
4. `onAuthStateChange` detecta login
5. Busca profile na tabela `profiles`
6. `redirectUserBasedOnRole()` redireciona:
   - `role === 'admin'` → `/`
   - `role === 'institution'` → `/institution/dashboard`

### Proteção de Rotas
- `ProtectedRoute` verifica autenticação
- Verifica `allowedRoles` para acesso
- Redireciona para `/login` se não autenticado
- Redireciona para dashboard correto se role incorreto

### Problema Conhecido: RLS Timeout
- **Sintoma:** Login demora 106 segundos e timeout
- **Causa:** RLS policies criam deadlock circular
- **Solução Temporária:** Desabilitar RLS (ver `docs/RLS_POLICY_FIX.md`)
- **SQL Fix:** Executar em Supabase Dashboard

---

## 📊 FUNCIONALIDADES POR MÓDULO

### 1. Módulo de Instituições
- ✅ CRUD completo (criar, ler, atualizar, excluir)
- ✅ Listagem com busca
- ✅ Validação de nome único
- ✅ Validação de exclusão (não pode ter famílias/entregas)

### 2. Módulo de Famílias
- ✅ CRUD completo
- ✅ Sistema de bloqueio automático
- ✅ Desbloqueio manual (admin)
- ✅ Associação com instituições
- ✅ Validação de CPF único
- ✅ Busca por CPF ou nome

### 3. Módulo de Entregas
- ✅ Registro de entregas
- ✅ Validação de bloqueio
- ✅ Validação de vínculo família-instituição
- ✅ Integração com estoque (itens do estoque)
- ✅ Itens manuais (não do estoque)
- ✅ Histórico de entregas
- ✅ Geração de recibos em PDF

### 4. Módulo de Fornecedores
- ✅ CRUD de fornecedores (PF/PJ)
- ✅ Validação de CPF/CNPJ único
- ✅ Formatação automática de documentos
- ✅ Histórico de movimentações por fornecedor

### 5. Módulo de Produtos
- ✅ CRUD de produtos
- ✅ Soft delete (is_active)
- ✅ Unidade de medida configurável
- ✅ Produtos compartilhados entre instituições

### 6. Módulo de Estoque
- ✅ Estoque por instituição
- ✅ Movimentações (ENTRADA/SAIDA)
- ✅ Atualização automática via trigger
- ✅ Validação de estoque suficiente
- ✅ Integração com entregas (saída automática)
- ✅ Histórico de movimentações

### 7. Módulo de Recibos
- ✅ Geração de PDF (jsPDF)
- ✅ Recibos de entrada de estoque
- ✅ Recibos de saída de estoque
- ✅ Recibos de entrega
- ✅ Armazenamento no Supabase Storage

### 8. Dashboards
- ✅ Dashboard Admin (estatísticas globais)
- ✅ Dashboard Instituição (estatísticas específicas)
- ✅ Gráficos de entregas
- ✅ Tabelas de entregas recentes
- ✅ Cards de métricas

---

## 🚨 PROBLEMAS CONHECIDOS E SOLUÇÕES

### 1. Login Timeout (106 segundos)
**Problema:** RLS policies causam deadlock  
**Solução:** Desabilitar RLS temporariamente  
**Arquivo:** `docs/RLS_POLICY_FIX.md`  
**SQL:** Executar no Supabase Dashboard

### 2. Dados Mock vs Dados Reais
**Problema:** Algumas páginas ainda usam dados mock  
**Status:** Em migração para Supabase  
**Arquivo:** `docs/FRONTEND_TASKS.md`

### 3. RLS Policies
**Problema:** Políticas causam performance issues  
**Status:** Desabilitadas temporariamente para MVP  
**Futuro:** Reimplementar sem dependências circulares

---

## 📁 ESTRUTURA DE ARQUIVOS

```
cestas/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Index.tsx (Dashboard Admin)
│   │   ├── Institutions.tsx
│   │   ├── Families.tsx
│   │   ├── DeliveryManagement.tsx
│   │   ├── Reports.tsx
│   │   └── institution/
│   │       ├── InstitutionDashboard.tsx
│   │       ├── InstitutionFamilies.tsx
│   │       ├── InstitutionDelivery.tsx
│   │       └── InstitutionReports.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   ├── useInstitutions.ts
│   │   ├── useFamilies.ts
│   │   ├── useDeliveries.ts
│   │   └── useDashboardStats.ts
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   ├── FamilyInstitutionAssociation.tsx
│   │   └── ui/ (shadcn/ui components)
│   └── integrations/
│       └── supabase/
│           ├── client.ts
│           └── types.ts
├── supabase/
│   └── migrations/
│       ├── create_suppliers_table.sql
│       ├── create_products_table.sql
│       ├── create_inventory_table.sql
│       ├── create_stock_movements_table.sql
│       ├── create_receipts_table.sql
│       └── create_update_inventory_trigger.sql
└── docs/
    ├── BUSINESS_RULES.md
    ├── DATABASE_SETUP.md
    ├── API_INTEGRATION.md
    ├── FRONTEND_TASKS.md
    ├── BACKEND_TASKS.md
    ├── SUPPLIERS_GUIDE.md
    └── RLS_POLICY_FIX.md
```

---

## 🔧 COMANDOS ÚTEIS

### Desenvolvimento
```bash
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Build para produção
npm run lint         # Executar linter
```

### Supabase
```bash
# Gerar tipos atualizados
npx supabase gen types typescript --project-id eslfcjhnaojghzuswpgz > src/integrations/supabase/types.ts
```

### Variáveis de Ambiente
Criar `.env.local`:
```env
VITE_SUPABASE_URL=https://eslfcjhnaojghzuswpgz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend (Supabase)
- [x] Schema do banco criado
- [x] Triggers implementados
- [x] Funções SQL criadas
- [ ] RLS policies (desabilitadas temporariamente)
- [x] Migrações aplicadas

### Frontend
- [x] Autenticação implementada
- [x] Proteção de rotas
- [x] Hooks para CRUD
- [x] Interface de usuário
- [ ] Integração completa com Supabase (em andamento)
- [x] Loading states
- [x] Error handling

### Funcionalidades
- [x] CRUD Instituições
- [x] CRUD Famílias
- [x] CRUD Entregas
- [x] Sistema de bloqueio
- [x] Sistema de fornecedores
- [x] Sistema de estoque
- [x] Geração de recibos
- [x] Dashboards

---

## 📚 DOCUMENTAÇÃO RELACIONADA

### Essencial
- `docs/BUSINESS_RULES.md` - Regras de negócio completas
- `docs/DATABASE_SETUP.md` - Schema e estrutura do banco
- `docs/SUPPLIERS_GUIDE.md` - Guia do sistema de fornecedores

### Implementação
- `docs/FRONTEND_TASKS.md` - Tarefas de frontend
- `docs/BACKEND_TASKS.md` - Tarefas de backend
- `docs/API_INTEGRATION.md` - Padrões de API

### Troubleshooting
- `docs/RLS_POLICY_FIX.md` - Fix para login timeout
- `docs/QUICK_START_FIX.md` - Guia rápido de correção
- `docs/NEXT_STEPS.md` - Próximos passos

### Status
- `CURRENT_STATUS.md` - Status atual do projeto
- `MVP_STATUS.md` - Estado do MVP
- `context.md` - Contexto geral

---

## 🎯 PRÓXIMOS PASSOS SUGERIDOS

1. **Desabilitar RLS** (2 minutos) - Ver `docs/RLS_POLICY_FIX.md`
2. **Testar Login** (1 minuto)
3. **Testar CRUD** (10 minutos)
4. **Testar Fluxo Completo** (30 minutos)
5. **Reimplementar RLS** (futuro, sem dependências circulares)

---

## 🔑 CREDENCIAIS DE TESTE

### Admin
- **Email:** `teste@admin.com`
- **Senha:** `senha123`
- **Role:** `admin`

### Instituição
- **Email:** `instituicao@teste.com`
- **Senha:** `senha456`
- **Role:** `institution`

---

## 📞 SUPABASE PROJECT

- **URL:** https://eslfcjhnaojghzuswpgz.supabase.co
- **Dashboard:** https://app.supabase.com/project/eslfcjhnaojghzuswpgz
- **SQL Editor:** https://app.supabase.com/project/eslfcjhnaojghzuswpgz/sql/new

---

**Última Atualização:** Janeiro 2025  
**Versão do Documento:** 1.0.0

