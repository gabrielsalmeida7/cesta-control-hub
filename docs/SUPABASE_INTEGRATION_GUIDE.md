# SUPABASE_INTEGRATION_GUIDE.md

## Guia de Integração Supabase - Cesta Control Hub

**Versão:** 1.0.0  
**Última Atualização:** Janeiro 2025  
**Plataforma:** Supabase + React + TypeScript

---

## 🎯 Visão Geral

Este guia fornece instruções passo-a-passo para integrar o frontend React com o backend Supabase, incluindo configuração, autenticação, CRUD operations e troubleshooting.

---

## 🚀 CONFIGURAÇÃO INICIAL

### 1. **Variáveis de Ambiente**

**Arquivo:** `.env.local` (criar se não existir)

Copie o arquivo `.env.example` para `.env.local` e preencha com suas credenciais do Supabase:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Apenas para desenvolvimento local
```

**⚠️ IMPORTANTE:** 
- Nunca commite o arquivo `.env.local` no repositório
- O `VITE_SUPABASE_SERVICE_ROLE_KEY` não deve ser usado no frontend em produção
- Use Edge Functions para operações que requerem Service Role Key

**Verificar se está funcionando:**

```typescript
// src/integrations/supabase/client.ts
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### 2. **Cliente Supabase**

**Arquivo:** `src/integrations/supabase/client.ts` ✅ (já configurado)

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 3. **Geração de Tipos**

**Comando para gerar tipos atualizados:**

```bash
# Substitua YOUR_PROJECT_ID pelo ID do seu projeto Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

---

## 🔐 AUTENTICAÇÃO

### 1. **Criação de Usuários**

#### 1.1 Criar Usuário Admin

```typescript
// Script para criar admin (executar no Supabase Dashboard SQL Editor)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@araguari.mg.gov.br',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Administrador Sistema", "role": "admin"}'::jsonb
);

-- Criar perfil do admin
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', (raw_user_meta_data->>'role')::user_role
FROM auth.users
WHERE email = 'admin@araguari.mg.gov.br';
```

#### 1.2 Criar Usuário de Instituição

```typescript
-- Primeiro criar a instituição
INSERT INTO institutions (name, address, phone)
VALUES ('Centro Comunitário São José', 'Rua das Flores, 123', '(11) 9999-8888');

-- Criar usuário da instituição
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'instituicao@casesperanca.org.br',
  crypt('inst123', gen_salt('bf')),
  now(),
  now(),
  now(),
  json_build_object(
    'full_name', 'Responsável Instituição',
    'role', 'institution',
    'institution_id', (SELECT id FROM institutions WHERE name = 'Centro Comunitário São José')
  )::jsonb
);

-- Criar perfil da instituição
INSERT INTO profiles (id, email, full_name, role, institution_id)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name',
  (raw_user_meta_data->>'role')::user_role,
  (raw_user_meta_data->>'institution_id')::uuid
FROM auth.users
WHERE email = 'instituicao@casesperanca.org.br';
```

### 2. **Login no Frontend**

**Arquivo:** `src/hooks/useAuth.tsx` ✅ (já implementado)

```typescript
// Exemplo de uso do login
const { signIn, user, profile } = useAuth();

const handleLogin = async (email: string, password: string) => {
  const { error } = await signIn(email, password);
  if (!error) {
    // Login bem-sucedido
    console.log("User:", user);
    console.log("Profile:", profile);
  }
};
```

---

## 📊 CRUD OPERATIONS

### 1. **Instituições**

#### 1.1 Listar Instituições

```typescript
// Hook já criado: src/hooks/useInstitutions.ts
const { data: institutions, isLoading, error } = useInstitutions();

// Uso no componente
if (isLoading) return <div>Carregando...</div>;
if (error) return <div>Erro: {error.message}</div>;

return (
  <div>
    {institutions?.map((institution) => (
      <div key={institution.id}>{institution.name}</div>
    ))}
  </div>
);
```

#### 1.2 Criar Instituição

```typescript
const createInstitution = useCreateInstitution();

const handleCreate = async (data: {
  name: string;
  address: string;
  phone: string;
}) => {
  try {
    await createInstitution.mutateAsync(data);
    // Sucesso - toast será mostrado automaticamente
  } catch (error) {
    // Erro - toast será mostrado automaticamente
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

### 2. **Famílias**

#### 2.1 Listar Famílias

```typescript
// Para admin - todas as famílias
const { data: families } = useFamilies();

// Para instituição - apenas famílias vinculadas
const { data: institutionFamilies } = useInstitutionFamilies(
  profile?.institution_id
);
```

#### 2.2 Criar Família

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
    console.log("Família criada:", newFamily);
  } catch (error) {
    console.error("Erro ao criar família:", error);
  }
};
```

#### 2.3 Desbloquear Família

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

### 3. **Entregas**

#### 3.1 Criar Hook useDeliveries

**Arquivo:** `src/hooks/useDeliveries.ts` (criar)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Delivery = Tables<"deliveries">;
type DeliveryInsert = TablesInsert<"deliveries">;

export const useDeliveries = (institutionId?: string) => {
  return useQuery({
    queryKey: ["deliveries", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(
          `
          *,
          family:families(name, contact_person),
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
```

#### 3.2 Registrar Entrega

```typescript
const createDelivery = useCreateDelivery();

const handleDelivery = async (data: {
  family_id: string;
  institution_id: string;
  blocking_period_days: number;
  notes?: string;
}) => {
  try {
    await createDelivery.mutateAsync({
      ...data,
      delivery_date: new Date().toISOString(),
      delivered_by_user_id: user?.id
    });
  } catch (error) {
    console.error("Erro ao registrar entrega:", error);
  }
};
```

---

## 🔗 ASSOCIAÇÕES FAMÍLIA-INSTITUIÇÃO

### 1. **Vincular Família a Instituição**

```typescript
// Função para vincular família a instituição
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

// Hook para associação
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
    }
  });
};
```

### 2. **Listar Famílias Vinculadas**

```typescript
// Buscar famílias vinculadas a uma instituição
const getInstitutionFamilies = async (institutionId: string) => {
  const { data, error } = await supabase
    .from("families")
    .select(
      `
      *,
      institution_families!inner(institution_id)
    `
    )
    .eq("institution_families.institution_id", institutionId);

  if (error) throw error;
  return data;
};
```

---

## 📈 DASHBOARD STATS

### 1. **Stats do Admin**

```typescript
// Hook já criado: src/hooks/useDashboardStats.ts
const { data: stats, isLoading } = useDashboardStats();

// Uso no componente
if (isLoading) return <div>Carregando estatísticas...</div>;

return (
  <div>
    <div>Total de Instituições: {stats?.totalInstitutions}</div>
    <div>Total de Famílias: {stats?.totalFamilies}</div>
    <div>Total de Entregas: {stats?.totalDeliveries}</div>
    <div>Famílias Bloqueadas: {stats?.blockedFamilies}</div>
  </div>
);
```

### 2. **Stats da Instituição**

```typescript
// O mesmo hook funciona para instituição
const { data: stats } = useDashboardStats();

// Para instituição, retorna:
// - associatedFamilies
// - institutionDeliveries
// - blockedByInstitution
// - recentDeliveries
```

---

## 🧪 DADOS DE TESTE

### 1. **Script SQL para Dados de Teste**

```sql
-- Inserir instituições de teste
INSERT INTO institutions (name, address, phone) VALUES
('Centro Comunitário São José', 'Rua das Flores, 123', '(11) 9999-8888'),
('Associação Bem-Estar', 'Av. Principal, 456', '(11) 7777-6666'),
('Igreja Nossa Senhora', 'Praça Central, 789', '(11) 5555-4444');

-- Inserir famílias de teste
INSERT INTO families (name, contact_person, phone, members_count) VALUES
('Silva', 'João Silva', '(11) 1111-1111', 4),
('Santos', 'Maria Santos', '(11) 2222-2222', 3),
('Oliveira', 'Pedro Oliveira', '(11) 3333-3333', 5);

-- Vincular famílias a instituições
INSERT INTO institution_families (institution_id, family_id)
SELECT i.id, f.id
FROM institutions i, families f
WHERE i.name = 'Centro Comunitário São José' AND f.name = 'Silva';

INSERT INTO institution_families (institution_id, family_id)
SELECT i.id, f.id
FROM institutions i, families f
WHERE i.name = 'Centro Comunitário São José' AND f.name = 'Santos';
```

### 2. **Script JavaScript para Testes**

```typescript
// Função para popular dados de teste
const populateTestData = async () => {
  // Criar instituições
  const institutions = [
    {
      name: "Centro Comunitário São José",
      address: "Rua das Flores, 123",
      phone: "(11) 9999-8888"
    },
    {
      name: "Associação Bem-Estar",
      address: "Av. Principal, 456",
      phone: "(11) 7777-6666"
    }
  ];

  for (const institution of institutions) {
    const { data, error } = await supabase
      .from("institutions")
      .insert(institution)
      .select()
      .single();

    if (error) console.error("Erro ao criar instituição:", error);
    else console.log("Instituição criada:", data);
  }

  // Criar famílias
  const families = [
    {
      name: "Silva",
      contact_person: "João Silva",
      phone: "(11) 1111-1111",
      members_count: 4
    },
    {
      name: "Santos",
      contact_person: "Maria Santos",
      phone: "(11) 2222-2222",
      members_count: 3
    }
  ];

  for (const family of families) {
    const { data, error } = await supabase
      .from("families")
      .insert(family)
      .select()
      .single();

    if (error) console.error("Erro ao criar família:", error);
    else console.log("Família criada:", data);
  }
};
```

---

## 🚨 TROUBLESHOOTING

### 1. **Problemas Comuns**

#### 1.1 Erro de RLS (Row Level Security)

```
Error: new row violates row-level security policy
```

**Solução:**

- Verificar se RLS está configurado corretamente
- Verificar se usuário tem permissão para a operação
- Verificar se políticas estão ativas

```typescript
// Verificar políticas ativas
const { data, error } = await supabase.from("institutions").select("*");

if (error) {
  console.error("Erro RLS:", error);
  // Verificar se usuário está logado
  console.log("User:", await supabase.auth.getUser());
}
```

#### 1.2 Erro de Foreign Key

```
Error: insert or update on table violates foreign key constraint
```

**Solução:**

- Verificar se IDs existem nas tabelas referenciadas
- Verificar se UUIDs estão no formato correto

```typescript
// Verificar se instituição existe antes de vincular
const { data: institution } = await supabase
  .from("institutions")
  .select("id")
  .eq("id", institutionId)
  .single();

if (!institution) {
  throw new Error("Instituição não encontrada");
}
```

#### 1.3 Erro de Trigger

```
Error: trigger function failed
```

**Solução:**

- Verificar se triggers estão funcionando
- Verificar logs do Supabase
- Testar triggers manualmente

```sql
-- Testar trigger manualmente
INSERT INTO deliveries (family_id, institution_id, blocking_period_days)
VALUES ('family-uuid', 'institution-uuid', 30);
```

### 2. **Debugging**

#### 2.1 Logs do Supabase

```typescript
// Habilitar logs detalhados
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
});
```

#### 2.2 Verificar Conexão

```typescript
// Testar conexão
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("institutions")
      .select("count")
      .limit(1);

    if (error) throw error;
    console.log("Conexão OK:", data);
  } catch (error) {
    console.error("Erro de conexão:", error);
  }
};
```

---

## 📋 CHECKLIST DE INTEGRAÇÃO

### Configuração

- [ ] Variáveis de ambiente configuradas
- [ ] Cliente Supabase funcionando
- [ ] Tipos gerados e atualizados

### Autenticação

- [ ] Usuários de teste criados
- [ ] Login funcionando
- [ ] Perfis sendo criados automaticamente

### CRUD Operations

- [ ] Instituições: Create, Read, Update, Delete
- [ ] Famílias: Create, Read, Update, Delete
- [ ] Entregas: Create, Read
- [ ] Associações: Create, Read, Delete

### Validações

- [ ] RLS funcionando
- [ ] Triggers funcionando
- [ ] Validações de negócio implementadas

### Testes

- [ ] Dados de teste inseridos
- [ ] Fluxo completo testado
- [ ] Erros tratados adequadamente

---

## 🔗 DOCUMENTAÇÃO RELACIONADA

- **📄 [DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Schema e configuração do banco
- **📄 [BACKEND_TASKS.md](./BACKEND_TASKS.md)** - Tarefas de backend
- **📄 [FRONTEND_TASKS.md](./FRONTEND_TASKS.md)** - Tarefas de frontend
- **📄 [BUSINESS_RULES.md](./BUSINESS_RULES.md)** - Regras de negócio

---

## ⏱️ TEMPO ESTIMADO

| Tarefa              | Tempo           |
| ------------------- | --------------- |
| **Configuração**    | 1-2 horas       |
| **Autenticação**    | 2-3 horas       |
| **CRUD Básico**     | 4-6 horas       |
| **Associações**     | 2-3 horas       |
| **Dashboard Stats** | 2-3 horas       |
| **Testes e Debug**  | 2-4 horas       |
| **Total**           | **13-21 horas** |

---

**Prioridade:** 🔴 **Crítica** - Essencial para MVP funcional  
**Dependências:** Schema do banco, RLS configurado  
**Próximo Passo:** Começar com configuração e autenticação
