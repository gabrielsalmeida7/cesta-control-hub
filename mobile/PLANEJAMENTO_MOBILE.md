# Planejamento — Versão Mobile (Expo)

**Projeto:** Cesta Control Hub  
**Branch:** `Native`  
**Stack mobile:** Expo SDK 56 · React Native · TypeScript  
**Última atualização:** Junho 2026

---

## 1. Objetivo

Replicar no mobile (iOS e Android) as mesmas funcionalidades e a mesma identidade visual do aplicativo web (Vite + React + shadcn/ui), mantendo integração com o mesmo backend Supabase e as mesmas regras de negócio documentadas em `docs/BUSINESS_RULES.md`.

---

## 2. Arquitetura proposta

```
/workspace
├── src/                    # App web (existente)
├── mobile/                 # App Expo (esta branch)
│   ├── app/                # Rotas (Expo Router) — a criar
│   ├── components/         # UI mobile
│   ├── hooks/              # Hooks compartilháveis ou espelhados
│   ├── integrations/       # Cliente Supabase mobile
│   ├── constants/          # Tema, cores, espaçamentos
│   └── assets/             # Ícones, splash, logos
└── supabase/               # Backend compartilhado
```

### Decisões técnicas

| Área | Web (atual) | Mobile (planejado) |
|------|-------------|-------------------|
| Navegação | React Router DOM | Expo Router (file-based) |
| Estilização | Tailwind + shadcn/ui | NativeWind ou StyleSheet + design tokens |
| Estado servidor | TanStack React Query | TanStack React Query |
| Autenticação | Supabase Auth | Supabase Auth + `expo-secure-store` |
| Formulários | react-hook-form + zod | react-hook-form + zod |
| Ícones | lucide-react | lucide-react-native |
| Gráficos | recharts | react-native-chart-kit ou victory-native |
| PDF | jspdf | expo-print / expo-sharing |

### Código compartilhado

- **Tipos Supabase:** reutilizar `src/integrations/supabase/types.ts` (copiar ou extrair para pacote `shared/` em fase posterior).
- **Validações Zod:** extrair schemas de formulários para módulo compartilhável.
- **Regras de negócio puras:** funções sem dependência de DOM podem ser compartilhadas.

---

## 3. Mapeamento de telas (web → mobile)

### Rotas públicas

| Web | Mobile (rota planejada) | Prioridade |
|-----|-------------------------|------------|
| `/login` | `app/(auth)/login.tsx` | P0 |
| `/reset-password` | `app/(auth)/reset-password.tsx` | P1 |
| `/politica-privacidade` | `app/(public)/politica-privacidade.tsx` | P2 |
| `/portal-titular` | `app/(public)/portal-titular.tsx` | P2 |

### Rotas admin (`role: admin`)

| Web | Mobile | Prioridade |
|-----|--------|------------|
| `/` (Index / Dashboard) | `app/(admin)/index.tsx` | P0 |
| `/institutions` | `app/(admin)/institutions.tsx` | P0 |
| `/families` | `app/(admin)/families.tsx` | P0 |
| `/delivery` | `app/(admin)/delivery.tsx` | P0 |
| `/reports` | `app/(admin)/reports.tsx` | P1 |
| `/suppliers` | `app/(admin)/suppliers.tsx` | P1 |

### Rotas instituição (`role: institution`)

| Web | Mobile | Prioridade |
|-----|--------|------------|
| `/institution/dashboard` | `app/(institution)/dashboard.tsx` | P0 |
| `/institution/families` | `app/(institution)/families.tsx` | P0 |
| `/institution/delivery` | `app/(institution)/delivery.tsx` | P0 |
| `/institution/reports` | `app/(institution)/reports.tsx` | P1 |
| `/institution/suppliers` | `app/(institution)/suppliers.tsx` | P1 |

---

## 4. Hooks e integrações a portar

| Hook / módulo web | Uso no mobile |
|-------------------|---------------|
| `useAuth` | Autenticação, sessão, perfil e roles |
| `useInstitutions` | CRUD de instituições (admin) |
| `useFamilies` | CRUD de famílias |
| `useDeliveries` | Registro e histórico de entregas |
| `useDeliveriesByInstitution` | Entregas por instituição |
| `useInstitutionDeliveries` | Fluxo institucional de entrega |
| `useDashboardStats` | Cards do dashboard |
| `useSuppliers` / `useProducts` / `useInventory` | Módulo de fornecedores |
| `useBeneficiaryInstitutions` | Instituições beneficiárias |
| `useReceipts` | Comprovantes de entrega |
| `useReportExport` | Exportação de relatórios |
| `useConsentManagement` | LGPD / consentimento |
| `useAuditLog` | Auditoria de ações |
| `useAlerts` | Alertas de fraude |
| `ProtectedRoute` | Middleware de rota no Expo Router |

---

## 5. Design system mobile

### Identidade visual

- Reproduzir paleta, tipografia e espaçamentos do web (Tailwind config em `tailwind.config.ts`).
- Logo: `public/CestaJustaLogo.svg` → exportar PNG para `mobile/assets/`.
- Componentes base a criar: `Button`, `Input`, `Card`, `Badge`, `Dialog/Modal`, `Tabs`, `Toast`, `Select`, `Table` (lista com FlatList).

### Padrões de UX mobile

- Navegação por abas inferiores para fluxos principais (instituição/admin).
- Drawer ou menu lateral para ações secundárias.
- Formulários em telas dedicadas ou bottom sheets.
- Pull-to-refresh em listas.
- Feedback tátil (`expo-haptics`) em ações críticas (confirmar entrega).

---

## 6. Autenticação e segurança

1. Configurar variáveis de ambiente (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
2. Persistir sessão com `@supabase/supabase-js` + `expo-secure-store`.
3. Proteger rotas via layout groups no Expo Router (`(admin)`, `(institution)`).
4. Deep linking para reset de senha (`expo-linking`).
5. Não expor service role key no cliente mobile.
6. Respeitar RLS do Supabase (mesmas políticas do web).

---

## 7. Fases de implementação

### Fase 0 — Fundação ✅ (atual)

- [x] Branch `Native` criada
- [x] Projeto Expo inicializado em `mobile/`
- [x] Documento de planejamento

### Fase 1 — Infraestrutura ✅

- [x] Instalar Expo Router, React Query, Supabase, NativeWind
- [x] Configurar cliente Supabase mobile
- [x] Implementar `AuthProvider` e fluxo de login
- [x] Layout base com navegação por role
- [x] Tema e componentes UI base

### Fase 2 — Módulos core (MVP mobile) ✅

- [x] Dashboard (admin e instituição)
- [x] Instituições (admin)
- [x] Famílias (admin e instituição)
- [x] Entregas com validação de bloqueio
- [x] Busca de família por CPF

### Fase 3 — Módulos complementares ✅

- [x] Relatórios e exportação CSV
- [x] Fornecedores, estoque e produtos
- [x] Comprovantes (expo-print + sharing)
- [x] Portal do titular e LGPD
- [x] Reset senha (deep link via expo-linking)

### Fase 4 — Qualidade e publicação ✅

- [x] TypeScript strict + verificação de tipos
- [x] FlatList virtualizada nas listas
- [x] Configurar EAS Build (`eas.json`)
- [x] Ícones, splash screen (assets placeholder)
- [ ] Submissão App Store / Google Play (requer conta desenvolvedor)

---

## 8. Dependências planejadas (próximos passos)

```bash
cd mobile
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store
npm install @tanstack/react-query react-hook-form zod @hookform/resolvers
# Estilização (escolher uma abordagem):
npm install nativewind tailwindcss
```

---

## 9. Variáveis de ambiente

Criar `mobile/.env` (não commitar):

```env
EXPO_PUBLIC_SUPABASE_URL=<mesmo valor de VITE_SUPABASE_URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<mesmo valor de VITE_SUPABASE_ANON_KEY>
```

---

## 10. Comandos úteis

```bash
cd mobile
npm start          # Metro bundler (Expo Go)
npm run android    # Emulador Android
npm run ios        # Simulador iOS (macOS)
npm run web        # Preview web via Expo
```

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Componentes shadcn não existem no RN | Biblioteca de UI nativa + design tokens |
| Duplicação de lógica web/mobile | Extrair hooks e schemas compartilhados |
| Upload de arquivos no mobile | `expo-image-picker` + Supabase Storage |
| Gráficos complexos | Biblioteca RN dedicada ou simplificar visualização |
| Diferenças de auth (deep links) | Configurar redirect URLs no Supabase |

---

## 12. Critérios de conclusão

A versão mobile será considerada equivalente ao web quando:

1. Todos os perfis (admin, instituição) acessarem suas telas com as mesmas permissões.
2. CRUD de instituições, famílias e entregas funcionar contra o mesmo Supabase.
3. Regras de bloqueio e anti-fraude forem respeitadas.
4. Interface seguir a identidade visual do Cesta Control Hub.
5. App publicável nas lojas via EAS Build.
