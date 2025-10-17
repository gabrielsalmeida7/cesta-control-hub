# Refatoração Frontend: Supabase → API Customizada

## 🔄 Mudanças Necessárias no Frontend

Este documento detalha todas as refatorações necessárias no frontend para migrar do Supabase para a API customizada.

---

## 1. CLIENTE HTTP

### 1.1 Criar Cliente HTTP

**Criar**: `src/lib/api-client.ts`

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Interceptor para adicionar JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 1.2 Instalar Dependências

```bash
npm install axios
```

---

## 2. TIPOS TYPESCRIPT

### 2.1 Remover Tipos Supabase

**Remover**: `src/integrations/supabase/types.ts`

### 2.2 Criar Novos Tipos

**Criar**: `src/types/api.ts`

```typescript
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "institution";
  institution_id?: string;
}

export interface Institution {
  id: string;
  name: string;
  address: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  contact_person: string;
  phone?: string;
  members_count: number;
  is_blocked: boolean;
  blocked_until?: string;
  blocked_by_institution_id?: string;
  block_reason?: string;
  created_at: string;
  updated_at: string;
  blocked_by_institution?: Institution;
  institutions?: Institution[];
}

export interface Delivery {
  id: string;
  family_id: string;
  institution_id: string;
  blocking_period_days: number;
  notes?: string;
  delivered_by_user_id?: string;
  delivery_date: string;
  created_at: string;
  family?: Family;
  institution?: Institution;
  delivered_by_user?: User;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface CreateInstitutionDto {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateInstitutionDto {
  name?: string;
  address?: string;
  phone?: string;
}

export interface CreateFamilyDto {
  name: string;
  contact_person: string;
  phone?: string;
  members_count: number;
}

export interface UpdateFamilyDto {
  name?: string;
  contact_person?: string;
  phone?: string;
  members_count?: number;
  is_blocked?: boolean;
  blocked_until?: string;
  blocked_by_institution_id?: string;
  block_reason?: string;
}

export interface CreateDeliveryDto {
  family_id: string;
  institution_id: string;
  blocking_period_days: number;
  notes?: string;
}
```

---

## 3. AUTENTICAÇÃO

### 3.1 Refatorar useAuth

**Modificar**: `src/hooks/useAuth.tsx`

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react";
import apiClient from "@/lib/api-client";
import type { User, LoginResponse } from "@/types/api";

interface AuthContextType {
  user: User | null;
  profile: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token salvo
    const token = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setProfile(userData);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", {
        email,
        password
      });

      const { access_token, user: userData } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setProfile(userData);

      return { error: null };
    } catch (error: any) {
      console.error("Login error:", error);
      return { error: error.response?.data?.message || "Erro ao fazer login" };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

---

## 4. HOOKS REACT QUERY

### 4.1 Refatorar useInstitutions

**Modificar**: `src/hooks/useInstitutions.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type {
  Institution,
  CreateInstitutionDto,
  UpdateInstitutionDto
} from "@/types/api";

export const useInstitutions = () => {
  return useQuery({
    queryKey: ["institutions"],
    queryFn: async () => {
      const { data } = await apiClient.get<Institution[]>("/institutions");
      return data;
    }
  });
};

export const useCreateInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (institution: CreateInstitutionDto) => {
      const { data } = await apiClient.post<Institution>(
        "/institutions",
        institution
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast({
        title: "Sucesso",
        description: "Instituição criada com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description:
          "Erro ao criar instituição: " +
          (error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
  });
};

export const useUpdateInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: UpdateInstitutionDto;
    }) => {
      const { data } = await apiClient.patch<Institution>(
        `/institutions/${id}`,
        updates
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast({
        title: "Sucesso",
        description: "Instituição atualizada com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description:
          "Erro ao atualizar instituição: " +
          (error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
  });
};

export const useDeleteInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/institutions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast({
        title: "Sucesso",
        description: "Instituição excluída com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description:
          "Erro ao excluir instituição: " +
          (error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
  });
};
```

### 4.2 Refatorar useFamilies

**Modificar**: `src/hooks/useFamilies.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { Family, CreateFamilyDto, UpdateFamilyDto } from "@/types/api";

export const useFamilies = () => {
  return useQuery({
    queryKey: ["families"],
    queryFn: async () => {
      const { data } = await apiClient.get<Family[]>("/families");
      return data;
    }
  });
};

export const useInstitutionFamilies = (institutionId?: string) => {
  return useQuery({
    queryKey: ["institution-families", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data } = await apiClient.get<Family[]>(
        `/families?institution_id=${institutionId}`
      );
      return data;
    },
    enabled: !!institutionId
  });
};

export const useCreateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (family: CreateFamilyDto) => {
      const { data } = await apiClient.post<Family>("/families", family);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      toast({
        title: "Sucesso",
        description: "Família criada com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description:
          "Erro ao criar família: " +
          (error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
  });
};

export const useUpdateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: UpdateFamilyDto;
    }) => {
      const { data } = await apiClient.patch<Family>(
        `/families/${id}`,
        updates
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      toast({
        title: "Sucesso",
        description: "Família atualizada com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description:
          "Erro ao atualizar família: " +
          (error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
  });
};

export const useDeleteFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/families/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      toast({
        title: "Sucesso",
        description: "Família excluída com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description:
          "Erro ao excluir família: " +
          (error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
  });
};

export const useAssociateFamilyWithInstitution = () => {
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
      const { data } = await apiClient.post(
        `/families/${familyId}/institutions`,
        { institution_id: institutionId }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast({
        title: "Sucesso",
        description: "Família associada à instituição com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description:
          "Erro ao associar família: " +
          (error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
  });
};

export const useDisassociateFamilyFromInstitution = () => {
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
      await apiClient.delete(
        `/families/${familyId}/institutions/${institutionId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast({
        title: "Sucesso",
        description: "Família desassociada da instituição com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description:
          "Erro ao desassociar família: " +
          (error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
  });
};
```

### 4.3 Criar useDeliveries

**Criar**: `src/hooks/useDeliveries.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { Delivery, CreateDeliveryDto } from "@/types/api";

export const useDeliveries = (institutionId?: string) => {
  return useQuery({
    queryKey: ["deliveries", institutionId],
    queryFn: async () => {
      const url = institutionId
        ? `/deliveries?institution_id=${institutionId}`
        : "/deliveries";
      const { data } = await apiClient.get<Delivery[]>(url);
      return data;
    },
    enabled: !!institutionId
  });
};

export const useCreateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (delivery: CreateDeliveryDto) => {
      const { data } = await apiClient.post<Delivery>("/deliveries", delivery);
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
    onError: (error: any) => {
      toast({
        title: "Erro",
        description:
          "Erro ao registrar entrega: " +
          (error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
  });
};

export const useCanDeliverToFamily = () => {
  return useMutation({
    mutationFn: async ({
      familyId,
      institutionId
    }: {
      familyId: string;
      institutionId: string;
    }) => {
      const { data } = await apiClient.post(`/deliveries/validate`, {
        family_id: familyId,
        institution_id: institutionId
      });
      return data;
    }
  });
};
```

### 4.4 Refatorar useDashboardStats

**Modificar**: `src/hooks/useDashboardStats.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface DashboardStats {
  totalInstitutions?: number;
  totalFamilies?: number;
  totalDeliveries?: number;
  blockedFamilies?: number;
  associatedFamilies?: number;
  institutionDeliveries?: number;
  blockedByInstitution?: number;
  recentDeliveries?: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
      return data;
    }
  });
};
```

---

## 5. VARIÁVEIS DE AMBIENTE

### 5.1 Atualizar .env.local

**Modificar**: `.env.local`

```bash
# Remover
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Adicionar
VITE_API_URL=http://localhost:3000/api
```

---

## 6. COMPONENTES

### 6.1 Atualizar App.tsx

**Modificar**: `src/App.tsx`

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { AppRoutes } from "./AppRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 3
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### 6.2 Atualizar Login.tsx

**Modificar**: `src/pages/Login.tsx`

```typescript
// Remover imports do Supabase
// import { supabase } from '@/integrations/supabase/client';

// Adicionar
import { useAuth } from "@/hooks/useAuth";

// No handleSubmit, substituir:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const { error } = await signIn(email, password);

  if (error) {
    setError(error);
  } else {
    // Redirecionamento automático via useAuth
  }

  setLoading(false);
};
```

---

## 7. REMOÇÕES

### 7.1 Arquivos a Remover

```bash
# Remover integração Supabase
rm -rf src/integrations/supabase/
rm src/integrations/supabase/client.ts
rm src/integrations/supabase/types.ts
```

### 7.2 Dependências a Remover

```bash
npm uninstall @supabase/supabase-js
```

---

## 8. CHECKLIST DE REFATORAÇÃO

### Autenticação

- [ ] Remover imports do Supabase
- [ ] Implementar apiClient
- [ ] Refatorar useAuth
- [ ] Atualizar Login.tsx
- [ ] Testar login/logout

### Hooks

- [ ] Refatorar useInstitutions
- [ ] Refatorar useFamilies
- [ ] Criar useDeliveries
- [ ] Refatorar useDashboardStats
- [ ] Testar todos os hooks

### Tipos

- [ ] Remover types.ts do Supabase
- [ ] Criar types/api.ts
- [ ] Atualizar imports nos componentes
- [ ] Verificar TypeScript

### Configuração

- [ ] Atualizar .env.local
- [ ] Remover dependências Supabase
- [ ] Atualizar App.tsx
- [ ] Testar integração completa

---

## 9. TESTES

### 9.1 Testar Autenticação

```typescript
// Teste manual no console
const testAuth = async () => {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@test.com", password: "senha123" })
  });
  const data = await response.json();
  console.log(data);
};
```

### 9.2 Testar CRUD

```typescript
// Teste de instituições
const testInstitutions = async () => {
  const token = localStorage.getItem("access_token");
  const response = await fetch("http://localhost:3000/api/institutions", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await response.json();
  console.log(data);
};
```

---

**Próximo passo**: Consulte [database-migration.md](./database-migration.md) para estratégias de migração do banco de dados.
