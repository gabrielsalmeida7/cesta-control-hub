# FRONTEND_TASKS.md

## Tarefas de Frontend - Cesta Control Hub

**Versão:** 1.0.0  
**Última Atualização:** Janeiro 2025  
**Prioridade:** 🔴 Crítica para MVP

---

## 🎯 Visão Geral

Este documento lista todas as tarefas de frontend necessárias para completar o MVP do Cesta Control Hub. As tarefas estão organizadas por módulo e prioridade, com instruções específicas para cada implementação.

---

## 🔴 PRIORIDADE CRÍTICA (Bloqueadores do MVP)

### 1. **Módulo de Instituições**

#### 1.1 Substituir Dados Mock por Supabase

**Arquivo:** `src/pages/Institutions.tsx`

**Tarefas:**

- [ ] Remover array `institutions` mock (linhas 53-122)
- [ ] Importar e usar hook `useInstitutions`
- [ ] Implementar loading state durante fetch
- [ ] Implementar error state para falhas
- [ ] Atualizar interface para usar dados reais

**Código de Exemplo:**

```typescript
// Substituir mock data por:
const { data: institutions, isLoading, error } = useInstitutions();

// Adicionar loading state:
if (isLoading) return <div>Carregando instituições...</div>;
if (error) return <div>Erro ao carregar instituições</div>;
```

#### 1.2 Conectar Formulário de Criação

**Arquivo:** `src/pages/Institutions.tsx`

**Tarefas:**

- [ ] Implementar botão "Nova Instituição" (linha 166)
- [ ] Criar dialog de criação com formulário
- [ ] Usar hook `useCreateInstitution`
- [ ] Validar campos obrigatórios
- [ ] Mostrar feedback de sucesso/erro

**Código de Exemplo:**

```typescript
const createInstitution = useCreateInstitution();

const handleCreate = async (data: InstitutionFormData) => {
  await createInstitution.mutateAsync(data);
  setIsCreateDialogOpen(false);
};
```

#### 1.3 Conectar Formulário de Edição

**Arquivo:** `src/pages/Institutions.tsx`

**Tarefas:**

- [ ] Usar hook `useUpdateInstitution` no `onSubmit` (linha 140)
- [ ] Remover lógica de atualização local
- [ ] Implementar loading state no botão
- [ ] Validar dados antes de enviar

#### 1.4 Implementar Exclusão

**Tarefas:**

- [ ] Adicionar botão "Excluir" nos cards
- [ ] Criar dialog de confirmação
- [ ] Usar hook `useDeleteInstitution`
- [ ] Validar se instituição pode ser excluída

### 2. **Módulo de Famílias**

#### 2.1 Substituir Dados Mock por Supabase

**Arquivo:** `src/pages/Families.tsx`

**Tarefas:**

- [ ] Remover array `families` mock (linhas 40-98)
- [ ] Importar e usar hook `useFamilies`
- [ ] Implementar loading/error states
- [ ] Atualizar interface para dados reais

#### 2.2 Conectar Formulário de Criação

**Tarefas:**

- [ ] Implementar botão "Nova Família" (linha 156)
- [ ] Criar dialog de criação
- [ ] Usar hook `useCreateFamily`
- [ ] Validar CPF único
- [ ] Validar campos obrigatórios

#### 2.3 Conectar Formulário de Edição

**Tarefas:**

- [ ] Implementar botão "Editar" (linha 196)
- [ ] Criar dialog de edição
- [ ] Usar hook `useUpdateFamily`
- [ ] Manter validações

#### 2.4 Implementar Desbloqueio Manual

**Tarefas:**

- [ ] Conectar botão "Desbloquear" (linha 208)
- [ ] Usar hook `useUpdateFamily` para desbloquear
- [ ] Implementar justificativa obrigatória
- [ ] Validar permissão de admin

**Código de Exemplo:**

```typescript
const updateFamily = useUpdateFamily();

const handleUnblock = async (familyId: string, reason: string) => {
  await updateFamily.mutateAsync({
    id: familyId,
    updates: {
      is_blocked: false,
      blocked_until: null,
      blocked_by_institution_id: null,
      block_reason: null
    }
  });
};
```

### 3. **Módulo de Entregas**

#### 3.1 Criar Hook useDeliveries

**Arquivo:** `src/hooks/useDeliveries.ts` (criar novo)

**Tarefas:**

- [ ] Criar hook para listar entregas
- [ ] Criar hook para criar entrega
- [ ] Implementar filtros por instituição
- [ ] Implementar ordenação por data

**Código de Exemplo:**

```typescript
export const useDeliveries = (institutionId?: string) => {
  return useQuery({
    queryKey: ["deliveries", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(
          `
          *,
          family:families(name),
          institution:institutions(name)
        `
        )
        .eq("institution_id", institutionId)
        .order("delivery_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!institutionId
  });
};

export const useCreateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (delivery: TablesInsert<"deliveries">) => {
      const { data, error } = await supabase
        .from("deliveries")
        .insert(delivery)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["families"] });
      toast({
        title: "Sucesso",
        description: "Entrega registrada com sucesso!"
      });
    }
  });
};
```

#### 3.2 Conectar Registro de Entrega

**Arquivo:** `src/pages/DeliveryManagement.tsx`

**Tarefas:**

- [ ] Substituir dados mock por hook `useDeliveries`
- [ ] Conectar formulário de entrega ao hook `useCreateDelivery`
- [ ] Implementar validação de família bloqueada
- [ ] Implementar validação de estoque
- [ ] Remover lógica de atualização local

#### 3.3 Implementar Validações de Negócio

**Tarefas:**

- [ ] Verificar se família está ativa antes de permitir entrega
- [ ] Verificar se família está vinculada à instituição
- [ ] Verificar estoque disponível
- [ ] Mostrar mensagens de erro claras

**Código de Exemplo:**

```typescript
const canDeliverToFamily = (family: Family, institutionId: string) => {
  if (family.status === "blocked") {
    return {
      can: false,
      reason: `Família bloqueada até ${family.blockedUntil}`
    };
  }

  if (!family.institutionIds.includes(institutionId)) {
    return { can: false, reason: "Família não vinculada a esta instituição" };
  }

  return { can: true, reason: null };
};
```

### 4. **Sistema de Associação Família-Instituição**

#### 4.1 Criar Interface de Associação

**Arquivo:** `src/components/FamilyInstitutionAssociation.tsx` (criar novo)

**Tarefas:**

- [ ] Criar componente para vincular família a instituição
- [ ] Listar famílias não vinculadas
- [ ] Listar instituições disponíveis
- [ ] Implementar seleção múltipla
- [ ] Usar hook para criar associação

#### 4.2 Integrar com Página de Famílias

**Tarefas:**

- [ ] Adicionar botão "Vincular Instituição" na lista de famílias
- [ ] Mostrar instituições vinculadas em cada família
- [ ] Permitir remoção de vínculo (admin)

---

## 🟡 PRIORIDADE MÉDIA

### 5. **Dashboards com Dados Reais**

#### 5.1 Dashboard Admin

**Arquivo:** `src/pages/Index.tsx`

**Tarefas:**

- [ ] Conectar cards de estatísticas ao hook `useDashboardStats`
- [ ] Implementar loading states
- [ ] Implementar error handling
- [ ] Atualizar valores dos cards (linhas 52, 58, 64, 70)

#### 5.2 Dashboard Instituição

**Arquivo:** `src/pages/institution/InstitutionDashboard.tsx`

**Tarefas:**

- [ ] Conectar cards ao hook `useDashboardStats`
- [ ] Implementar loading states
- [ ] Mostrar dados específicos da instituição

### 6. **Validações e Feedback**

#### 6.1 Validações de Formulário

**Tarefas:**

- [ ] Implementar validação de CPF único
- [ ] Validar formato de telefone
- [ ] Validar campos obrigatórios
- [ ] Mostrar mensagens de erro específicas

#### 6.2 Loading e Error States

**Tarefas:**

- [ ] Adicionar loading states em todos os botões
- [ ] Implementar error boundaries
- [ ] Mostrar mensagens de erro amigáveis
- [ ] Implementar retry automático

---

## 🟢 PRIORIDADE BAIXA

### 7. **Funcionalidades Avançadas**

#### 7.1 Busca e Filtros

**Tarefas:**

- [ ] Implementar busca por nome nas listagens
- [ ] Adicionar filtros por status
- [ ] Implementar ordenação
- [ ] Adicionar paginação

#### 7.2 Melhorias de UX

**Tarefas:**

- [ ] Adicionar confirmações para ações destrutivas
- [ ] Implementar atalhos de teclado
- [ ] Melhorar responsividade mobile
- [ ] Adicionar tooltips explicativos

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Instituições

- [ ] Substituir dados mock
- [ ] Conectar criação
- [ ] Conectar edição
- [ ] Implementar exclusão
- [ ] Adicionar loading/error states

### Famílias

- [ ] Substituir dados mock
- [ ] Conectar criação
- [ ] Conectar edição
- [ ] Implementar desbloqueio
- [ ] Implementar associação com instituições

### Entregas

- [ ] Criar hook useDeliveries
- [ ] Conectar registro de entrega
- [ ] Implementar validações
- [ ] Conectar histórico
- [ ] Implementar validação de bloqueio

### Dashboards

- [ ] Conectar dados reais
- [ ] Implementar loading states
- [ ] Adicionar error handling

---

## 🔧 PADRÕES DE CÓDIGO

### 1. **Estrutura de Hooks**

```typescript
// Sempre usar este padrão para hooks de CRUD
export const useCreateEntity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: EntityInsert) => {
      const { data: result, error } = await supabase
        .from("entities")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      toast({
        title: "Sucesso",
        description: "Entidade criada com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar entidade: " + error.message,
        variant: "destructive"
      });
    }
  });
};
```

### 2. **Estrutura de Loading States**

```typescript
// Sempre implementar loading states
const { data, isLoading, error } = useQuery();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### 3. **Estrutura de Validação**

```typescript
// Sempre validar antes de ações críticas
const validateAction = (data: any) => {
  const errors: string[] = [];

  if (!data.requiredField) {
    errors.push("Campo obrigatório não preenchido");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
```

---

## 🔗 DOCUMENTAÇÃO RELACIONADA

- **📄 [BUSINESS_RULES.md](./BUSINESS_RULES.md)** - Regras de negócio para validações
- **📄 [API_INTEGRATION.md](./API_INTEGRATION.md)** - Padrões de integração com API
- **📄 [SUPABASE_INTEGRATION_GUIDE.md](./SUPABASE_INTEGRATION_GUIDE.md)** - Guia de integração
- **📄 [MVP_STATUS.md](./MVP_STATUS.md)** - Estado atual do projeto

---

## ⏱️ ESTIMATIVA DE TEMPO

| Módulo           | Tarefas        | Tempo Estimado  |
| ---------------- | -------------- | --------------- |
| **Instituições** | 4 tarefas      | 4-6 horas       |
| **Famílias**     | 4 tarefas      | 6-8 horas       |
| **Entregas**     | 3 tarefas      | 6-8 horas       |
| **Associações**  | 2 tarefas      | 4-6 horas       |
| **Dashboards**   | 2 tarefas      | 2-4 horas       |
| **Validações**   | 2 tarefas      | 2-4 horas       |
| **Total**        | **17 tarefas** | **24-36 horas** |

---

**Prioridade:** 🔴 **Crítica** - Essencial para MVP funcional  
**Dependências:** Hooks do Supabase, regras de negócio definidas  
**Próximo Passo:** Começar com módulo de Instituições
