# API_INTEGRATION.md

## Padrões de Integração API - Cesta Control Hub

**Versão:** 1.0.0  
**Última Atualização:** Janeiro 2025  
**Plataforma:** Supabase + React Query

---

## 🎯 Visão Geral

Este documento define os padrões de integração com a API do Supabase, incluindo hooks personalizados, tratamento de erros, cache e otimizações para o Cesta Control Hub.

---

## 🏗️ ARQUITETURA DE INTEGRAÇÃO

### 1. **Stack Tecnológico**

```typescript
// Dependências principais
- @supabase/supabase-js: Cliente Supabase
- @tanstack/react-query: Gerenciamento de estado servidor
- @tanstack/react-query-devtools: Debug de queries
- React Hook Form: Formulários
- Zod: Validação de schemas
```

### 2. **Estrutura de Hooks**

```
src/hooks/
├── useAuth.tsx              # Autenticação
├── useDashboardStats.ts     # Estatísticas
├── useInstitutions.ts       # CRUD Instituições
├── useFamilies.ts           # CRUD Famílias
├── useDeliveries.ts         # CRUD Entregas (criar)
└── use-toast.ts            # Notificações
```

---

## 🔐 AUTENTICAÇÃO

### 1. **Hook useAuth**

**Arquivo:** `src/hooks/useAuth.tsx` ✅ (já implementado)

```typescript
// Exemplo de uso
const { user, profile, signIn, signOut, loading } = useAuth();

// Verificar se usuário é admin
const isAdmin = profile?.role === "admin";

// Verificar se usuário é instituição
const isInstitution = profile?.role === "institution";
const userInstitutionId = profile?.institution_id;
```

### 2. **Proteção de Rotas**

**Arquivo:** `src/components/ProtectedRoute.tsx` ✅ (já implementado)

```typescript
// Exemplo de uso
<ProtectedRoute allowedRoles={['admin']}>
  <AdminComponent />
</ProtectedRoute>

<ProtectedRoute allowedRoles={['institution']}>
  <InstitutionComponent />
</ProtectedRoute>
```

---

## 🏢 INSTITUIÇÕES API

### 1. **Hook useInstitutions**

**Arquivo:** `src/hooks/useInstitutions.ts` ✅ (já implementado)

#### 1.1 Listar Instituições

```typescript
const { data: institutions, isLoading, error } = useInstitutions();

// Uso no componente
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return (
  <div>
    {institutions?.map((institution) => (
      <InstitutionCard key={institution.id} institution={institution} />
    ))}
  </div>
);
```

#### 1.2 Criar Instituição

```typescript
const createInstitution = useCreateInstitution();

const handleCreate = async (data: InstitutionFormData) => {
  try {
    const newInstitution = await createInstitution.mutateAsync({
      name: data.name,
      address: data.address,
      phone: data.phone
    });

    console.log("Instituição criada:", newInstitution);
    // Toast de sucesso será mostrado automaticamente
  } catch (error) {
    console.error("Erro ao criar instituição:", error);
    // Toast de erro será mostrado automaticamente
  }
};
```

#### 1.3 Atualizar Instituição

```typescript
const updateInstitution = useUpdateInstitution();

const handleUpdate = async (id: string, updates: Partial<Institution>) => {
  try {
    await updateInstitution.mutateAsync({ id, updates });
  } catch (error) {
    console.error("Erro ao atualizar:", error);
  }
};
```

#### 1.4 Excluir Instituição

```typescript
const deleteInstitution = useDeleteInstitution();

const handleDelete = async (id: string) => {
  if (confirm("Tem certeza que deseja excluir esta instituição?")) {
    try {
      await deleteInstitution.mutateAsync(id);
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  }
};
```

---

## 👨‍👩‍👧‍👦 FAMÍLIAS API

### 1. **Hook useFamilies**

**Arquivo:** `src/hooks/useFamilies.ts` ✅ (já implementado)

#### 1.1 Listar Famílias (Admin)

```typescript
const { data: families, isLoading, error } = useFamilies();

// Famílias com dados de bloqueio
families?.map((family) => ({
  ...family,
  blockedBy: family.blocked_by_institution?.name,
  isBlocked: family.is_blocked,
  blockedUntil: family.blocked_until
}));
```

#### 1.2 Listar Famílias (Instituição)

```typescript
const { data: institutionFamilies } = useInstitutionFamilies(
  profile?.institution_id
);

// Apenas famílias vinculadas à instituição
institutionFamilies?.map((family) => ({
  ...family,
  canReceiveDelivery: !family.is_blocked
}));
```

#### 1.3 Criar Família

```typescript
const createFamily = useCreateFamily();

const handleCreateFamily = async (data: {
  name: string;
  contact_person: string;
  phone?: string;
  members_count: number;
}) => {
  try {
    const newFamily = await createFamily.mutateAsync(data);

    // Opcional: Vincular automaticamente à instituição do usuário
    if (profile?.institution_id) {
      await associateFamilyInstitution(newFamily.id, profile.institution_id);
    }
  } catch (error) {
    console.error("Erro ao criar família:", error);
  }
};
```

#### 1.4 Desbloquear Família

```typescript
const updateFamily = useUpdateFamily();

const handleUnblock = async (familyId: string, reason: string) => {
  try {
    await updateFamily.mutateAsync({
      id: familyId,
      updates: {
        is_blocked: false,
        blocked_until: null,
        blocked_by_institution_id: null,
        block_reason: reason
      }
    });
  } catch (error) {
    console.error("Erro ao desbloquear:", error);
  }
};
```

### 2. **Associação Família-Instituição**

#### 2.1 Vincular Família

```typescript
// Função auxiliar
const associateFamilyInstitution = async (
  familyId: string,
  institutionId: string
) => {
  const { data, error } = await supabase
    .from("institution_families")
    .insert({ family_id: familyId, institution_id: institutionId });

  if (error) throw error;
  return data;
};

// Hook personalizado
export const useAssociateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: associateFamilyInstitution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      toast({
        title: "Sucesso",
        description: "Família vinculada à instituição!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao vincular família: " + error.message,
        variant: "destructive"
      });
    }
  });
};
```

#### 2.2 Desvincular Família

```typescript
const useDisassociateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      familyId,
      institutionId
    }: {
      familyId: string;
      institutionId: string;
    }) => {
      const { error } = await supabase
        .from("institution_families")
        .delete()
        .eq("family_id", familyId)
        .eq("institution_id", institutionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      toast({
        title: "Sucesso",
        description: "Família desvinculada da instituição!"
      });
    }
  });
};
```

---

## 🚚 ENTREGAS API

### 1. **Hook useDeliveries**

**Arquivo:** `src/hooks/useDeliveries.ts` (criar)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Delivery = Tables<"deliveries">;
type DeliveryInsert = TablesInsert<"deliveries">;

// Listar entregas
export const useDeliveries = (institutionId?: string) => {
  return useQuery({
    queryKey: ["deliveries", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(
          `
          *,
          family:families(name, contact_person, phone),
          institution:institutions(name),
          delivered_by:profiles(full_name)
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

// Criar entrega
export const useCreateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (delivery: DeliveryInsert) => {
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Sucesso",
        description: "Entrega registrada com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao registrar entrega: " + error.message,
        variant: "destructive"
      });
    }
  });
};

// Verificar se entrega é permitida
export const useCanDeliverToFamily = () => {
  return useMutation({
    mutationFn: async ({
      familyId,
      institutionId
    }: {
      familyId: string;
      institutionId: string;
    }) => {
      const { data, error } = await supabase.rpc("can_deliver_to_family", {
        p_family_id: familyId,
        p_institution_id: institutionId
      });

      if (error) throw error;
      return data;
    }
  });
};
```

### 2. **Registrar Entrega**

```typescript
const createDelivery = useCreateDelivery();
const canDeliver = useCanDeliverToFamily();

const handleDelivery = async (data: {
  familyId: string;
  institutionId: string;
  basketCount: number;
  blockingPeriod: number;
  notes?: string;
  additionalItems?: string[];
}) => {
  try {
    // Verificar se entrega é permitida
    const canDeliverResult = await canDeliver.mutateAsync({
      familyId: data.familyId,
      institutionId: data.institutionId
    });

    if (!canDeliverResult.can_deliver) {
      toast({
        title: "Entrega não permitida",
        description: canDeliverResult.reason,
        variant: "destructive"
      });
      return;
    }

    // Registrar entrega
    await createDelivery.mutateAsync({
      family_id: data.familyId,
      institution_id: data.institutionId,
      blocking_period_days: data.blockingPeriod,
      notes: data.notes,
      delivered_by_user_id: user?.id
    });
  } catch (error) {
    console.error("Erro ao registrar entrega:", error);
  }
};
```

### 3. **Histórico de Entregas**

```typescript
const { data: deliveries, isLoading } = useDeliveries(profile?.institution_id);

// Filtrar entregas por período
const recentDeliveries = deliveries?.filter((delivery) => {
  const deliveryDate = new Date(delivery.delivery_date);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return deliveryDate >= thirtyDaysAgo;
});

// Agrupar entregas por família
const deliveriesByFamily = deliveries?.reduce((acc, delivery) => {
  const familyName = delivery.family.name;
  if (!acc[familyName]) {
    acc[familyName] = [];
  }
  acc[familyName].push(delivery);
  return acc;
}, {} as Record<string, typeof deliveries>);
```

---

## 📊 DASHBOARD STATS API

### 1. **Hook useDashboardStats**

**Arquivo:** `src/hooks/useDashboardStats.ts` ✅ (já implementado)

#### 1.1 Stats do Admin

```typescript
const { data: stats, isLoading } = useDashboardStats();

// Para admin, stats contém:
// - totalInstitutions
// - totalFamilies
// - totalDeliveries
// - blockedFamilies

if (isLoading) return <StatsLoading />;

return (
  <div className="grid grid-cols-4 gap-4">
    <StatCard
      title="Instituições"
      value={stats?.totalInstitutions || 0}
      icon={<Building2 />}
    />
    <StatCard
      title="Famílias"
      value={stats?.totalFamilies || 0}
      icon={<Users />}
    />
    <StatCard
      title="Entregas"
      value={stats?.totalDeliveries || 0}
      icon={<Package />}
    />
    <StatCard
      title="Bloqueadas"
      value={stats?.blockedFamilies || 0}
      icon={<AlertTriangle />}
    />
  </div>
);
```

#### 1.2 Stats da Instituição

```typescript
const { data: stats } = useDashboardStats();

// Para instituição, stats contém:
// - associatedFamilies
// - institutionDeliveries
// - blockedByInstitution
// - recentDeliveries

return (
  <div className="grid grid-cols-4 gap-4">
    <StatCard
      title="Famílias Atendidas"
      value={stats?.associatedFamilies || 0}
    />
    <StatCard title="Entregas Este Mês" value={stats?.recentDeliveries || 0} />
    <StatCard
      title="Famílias Bloqueadas"
      value={stats?.blockedByInstitution || 0}
    />
    <StatCard
      title="Total de Entregas"
      value={stats?.institutionDeliveries || 0}
    />
  </div>
);
```

---

## 🔍 BUSCA E FILTROS

### 1. **Busca de Famílias**

```typescript
export const useSearchFamilies = (
  searchTerm: string,
  institutionId?: string
) => {
  return useQuery({
    queryKey: ["families-search", searchTerm, institutionId],
    queryFn: async () => {
      let query = supabase.from("families").select(`
          *,
          blocked_by_institution:blocked_by_institution_id(name)
        `);

      if (institutionId) {
        query = query
          .select(
            `
            *,
            blocked_by_institution:blocked_by_institution_id(name),
            institution_families!inner(institution_id)
          `
          )
          .eq("institution_families.institution_id", institutionId);
      }

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query.order("name");

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 2
  });
};
```

### 2. **Filtros de Entregas**

```typescript
export const useFilteredDeliveries = (
  institutionId: string,
  filters: {
    dateFrom?: string;
    dateTo?: string;
    familyId?: string;
  }
) => {
  return useQuery({
    queryKey: ["deliveries-filtered", institutionId, filters],
    queryFn: async () => {
      let query = supabase
        .from("deliveries")
        .select(
          `
          *,
          family:families(name, contact_person),
          institution:institutions(name)
        `
        )
        .eq("institution_id", institutionId);

      if (filters.dateFrom) {
        query = query.gte("delivery_date", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("delivery_date", filters.dateTo);
      }

      if (filters.familyId) {
        query = query.eq("family_id", filters.familyId);
      }

      const { data, error } = await query.order("delivery_date", {
        ascending: false
      });

      if (error) throw error;
      return data;
    },
    enabled: !!institutionId
  });
};
```

---

## ⚡ OTIMIZAÇÕES

### 1. **Cache e Invalidação**

```typescript
// Configuração do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

// Invalidação inteligente
const invalidateRelatedQueries = (queryClient: QueryClient) => {
  // Após criar entrega, invalidar stats e famílias
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  queryClient.invalidateQueries({ queryKey: ["families"] });
  queryClient.invalidateQueries({ queryKey: ["deliveries"] });
};
```

### 2. **Prefetch de Dados**

```typescript
// Prefetch de dados relacionados
const prefetchFamilyData = async (familyId: string) => {
  await queryClient.prefetchQuery({
    queryKey: ["family", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("families")
        .select("*")
        .eq("id", familyId)
        .single();

      if (error) throw error;
      return data;
    }
  });
};
```

### 3. **Paginação**

```typescript
export const usePaginatedFamilies = (page: number, pageSize: number = 20) => {
  return useQuery({
    queryKey: ["families-paginated", page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("families")
        .select("*", { count: "exact" })
        .range(from, to)
        .order("name");

      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page
      };
    }
  });
};
```

---

## 🚨 TRATAMENTO DE ERROS

### 1. **Error Boundary**

```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Algo deu errado</h2>
          <p>{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. **Tratamento de Erros em Hooks**

```typescript
// Padrão para tratamento de erros
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

      if (error) {
        // Log do erro para debug
        console.error("Supabase error:", error);

        // Mapear erros específicos
        if (error.code === "23505") {
          throw new Error("Registro já existe");
        } else if (error.code === "23503") {
          throw new Error("Referência inválida");
        } else {
          throw new Error(error.message);
        }
      }

      return result;
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Hooks Básicos

- [ ] useInstitutions (CRUD completo)
- [ ] useFamilies (CRUD completo)
- [ ] useDeliveries (criar)
- [ ] useDashboardStats (já implementado)

### Funcionalidades Avançadas

- [ ] useAssociateFamily
- [ ] useSearchFamilies
- [ ] useFilteredDeliveries
- [ ] usePaginatedFamilies

### Otimizações

- [ ] Cache configurado
- [ ] Prefetch implementado
- [ ] Error boundaries
- [ ] Loading states

### Testes

- [ ] Hooks testados
- [ ] Error handling testado
- [ ] Performance validada

---

## 🔗 DOCUMENTAÇÃO RELACIONADA

- **📄 [SUPABASE_INTEGRATION_GUIDE.md](./SUPABASE_INTEGRATION_GUIDE.md)** - Guia de integração
- **📄 [FRONTEND_TASKS.md](./FRONTEND_TASKS.md)** - Tarefas de frontend
- **📄 [BUSINESS_RULES.md](./BUSINESS_RULES.md)** - Regras de negócio
- **📄 [DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Schema do banco

---

## ⏱️ TEMPO ESTIMADO

| Tarefa                        | Tempo           |
| ----------------------------- | --------------- |
| **Hooks Básicos**             | 6-8 horas       |
| **Funcionalidades Avançadas** | 4-6 horas       |
| **Otimizações**               | 2-4 horas       |
| **Testes e Debug**            | 2-4 horas       |
| **Total**                     | **14-22 horas** |

---

**Prioridade:** 🔴 **Crítica** - Essencial para MVP funcional  
**Dependências:** Schema do banco, RLS configurado  
**Próximo Passo:** Implementar hook useDeliveries primeiro
