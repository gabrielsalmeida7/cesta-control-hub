# ToDo — Cesta Control Hub Mobile

**Projeto:** Cesta Control Hub (Expo SDK 56)  
**Branch:** `Native`  
**Referência:** [PLANEJAMENTO_MOBILE.md](./PLANEJAMENTO_MOBILE.md)  
**Última atualização:** Junho 2026

---

## Como usar este arquivo

1. Trabalhe **de cima para baixo** — itens em ordem de prioridade.
2. Marque `[x]` ao concluir cada tarefa.
3. O [PLANEJAMENTO_MOBILE.md](./PLANEJAMENTO_MOBILE.md) descreve a **visão geral**; este arquivo é o **checklist operacional** do dia a dia.
4. Itens marcados como **MVP** no planejamento já existem em versão inicial — aqui detalhamos o que falta para **paridade real** com o web.

### Legenda de status

| Símbolo | Significado |
|---------|-------------|
| ✅ | Concluído e testado |
| 🟡 | Implementado de forma simplificada — precisa evoluir |
| ⬜ | Pendente |

---

## Status atual (pós-teste no emulador)

| Área | Status | Observação |
|------|--------|------------|
| Infraestrutura (Router, Supabase, Auth, NativeWind) | ✅ | Tailwind fixado em v3; `babel-preset-expo` instalado |
| Login + LGPD | ✅ | Política via AsyncStorage |
| Dashboard instituição / admin | ✅ | A.3: cards, gráfico 6 meses, alertas e ações rápidas |
| Entregas instituição | 🟡 | A.1 concluída; PDF ok no emulador |
| Famílias | 🟡 | A.2 wizard completo; edição detalhada ainda simplificada |
| Relatórios + CSV | ✅ | A.3: filtros, fraude navegável, export por instituição |
| Fornecedores / estoque | 🟡 | CRUD básico instituição; admin é placeholder |
| PDF / recibos | 🟡 | `expo-print` + sharing; testar em celular físico |
| Portal titular / LGPD | 🟡 | UI mock; backend real pendente |
| Reset senha deep link | ⬜ | Código existe; falta configurar Supabase |
| Assets (logo, splash, ícones) | 🟡 | Placeholders PNG |
| Publicação (lojas) | ⬜ | `eas.json` pronto; build e submissão pendentes |

---

## Fase A — Instituição em campo (prioridade máxima)

> Perfil mais usado no mobile. Concluir antes do admin.

### A.1 Entregas (`app/(institution)/delivery.tsx`)

- [x] Busca de família por **CPF** dedicada (componente `SearchFamilyByCpf` como no web)
- [x] Validar **estoque insuficiente** antes de confirmar entrega
- [x] Melhorar UX de família **bloqueada** (dias restantes, badge, modal anti-fraude)
- [ ] Testar **geração e compartilhamento de PDF** em dispositivo físico
- [x] Confirmar feedback **haptics** em entrega bem-sucedida
- [x] Pull-to-refresh no histórico de entregas (se adicionar lista na tela)

### A.2 Famílias instituição (`app/(institution)/families/`)

- [x] Expandir wizard para espelhar campos do web ([`Families.tsx`](../../src/pages/Families.tsx)):
  - [x] Step 1 — Dados pessoais (nome, responsável, CPF, telefone)
  - [x] Step 2 — Endereço
  - [x] Step 3 — Composição familiar e renda
  - [x] Step 4 — Vulnerabilidades e benefícios governamentais
  - [x] Step 5 — LGPD / consentimento
- [x] Usar schemas Zod de [`utils/validation.ts`](./utils/validation.ts)
- [x] Integrar `useConsentManagement` (termo PDF + registro digital)
- [x] Desbloqueio manual e status de bloqueio na listagem

### A.3 Dashboard e relatórios instituição

- [x] Revisar cards do dashboard (valores vs web)
- [x] Alertas de fraude (`useFamiliesWithMultipleInstitutions`) com detalhe navegável
- [x] Gráfico de entregas (`DeliveriesChart` → `victory-native` ou simplificado)
- [x] Export CSV testado em Android real (compartilhar arquivo)

---

## Fase B — Admin (gestão central)

### B.1 Instituições (`app/(admin)/institutions.tsx`)

- [x] Remover dependência de `integrations/supabase/admin` em [`hooks/useInstitutions.ts`](./hooks/useInstitutions.ts) — usar apenas Edge Functions
- [x] Formulário completo de edição (não só criação/exclusão)
- [x] Tratamento de erros da Edge Function `create-institution-user`
- [x] Validação de email duplicado com mensagens amigáveis

### B.2 Famílias admin (`app/(admin)/families.tsx`)

- [x] Mesmo wizard completo da Fase A.2 (reutilizar componentes)
- [x] Associação família ↔ múltiplas instituições
- [x] Desbloqueio manual de famílias bloqueadas

### B.3 Entregas admin (`app/(admin)/delivery.tsx`)

- [x] Filtro/busca de famílias na lista
- [x] Seletor de instituição mais claro (dropdown ou modal)
- [x] Histórico de entregas recentes

### B.4 Fornecedores admin (`app/(admin)/suppliers.tsx`)

- [x] Substituir placeholder por tela funcional (espelhar [`InstitutionSuppliers.tsx`](../../src/pages/institution/InstitutionSuppliers.tsx))
- [x] Tabs: Fornecedores, Produtos, Estoque, Movimentações
- [x] Hooks: `useBeneficiaryInstitutions`, movimentações de estoque

### B.5 Relatórios admin

- [x] Gráficos no dashboard admin
- [x] Export de todos os tipos testado (entregas, famílias, instituições, resumo)

---

## Fase C — Identidade visual e UX

### C.1 Assets

- [x] Exportar logo de [`public/CestaJustaLogo.svg`](../../public/CestaJustaLogo.svg) → `assets/` (PNG)
- [x] Substituir ícones placeholder (`icon.png`, splash, adaptive icon)
- [x] Fundo splash e adaptive icon: `#004E64`

### C.2 Telas e componentes

- [x] Login mais próximo do web (logo, layout, `CestaLogin.svg`)
- [x] Componentes UI faltantes: `Select`, `Tabs` (se necessário), lista tipo `Table` refinada
- [x] Estados de loading/error consistentes em todas as telas
- [x] Revisar header (`AppHeader`) — exibir nome do usuário no mobile

### C.3 Navegação

- [x] Revisar drawer (fornecedores, entregas admin)
- [x] Garantir redirect correto por role após login
- [x] Tela 404 / fallback de rota

---

## Fase D — Integrações, segurança e LGPD

- [x] Deep link mobile + `intentFilters` Android para `cesta-control-hub://reset-password`
- [ ] Configurar redirect no painel Supabase Auth (URL acima + URL dev do Expo Go, se usar)
- [ ] Testar fluxo completo de **reset de senha** no Android
- [x] Portal do titular: fila via RPC `audit_log` (`lgpd_titular_requests`)
- [x] Consentimento: checkbox digital + checkbox termo assinado (upload adiado — ver item abaixo)
- [ ] `useConsentManagement`: upload de termo assinado (`expo-document-picker` / `expo-image-picker`) — **futuro**
- [x] Política de privacidade: conteúdo alinhado ao web ([`PrivacyPolicy.tsx`](../../src/pages/PrivacyPolicy.tsx))
- [x] Auditar que **service role key** nunca está no cliente mobile (`utils/env.ts`)

---

## Fase E — Qualidade de código

- [x] Remover `// @ts-nocheck` dos hooks em [`hooks/`](./hooks/) e corrigir tipos
- [x] Extrair pacote `shared/` (types, Zod, utils) — web + mobile
- [x] Adicionar `react-hook-form` + Zod nos formulários longos (`useFamilyWizardForm` + `FamilyWizard`)
- [x] Revisar duplicação web/mobile nos hooks portados (ver seção abaixo)
- [x] Documentar diferenças aceitáveis vs web no final deste arquivo

---

## Diferenças aceitáveis web vs mobile

| Área | Web | Mobile | Motivo |
|------|-----|--------|--------|
| Validação / CPF | `@cesta/shared` via `@/utils/*` | Idem | Pacote compartilhado |
| Tipos Supabase | `src/integrations/supabase/types.ts` | Cópia em `mobile/integrations/` | Metro/Vite não compartilham bundle; regenerar com CLI quando schema mudar |
| Admin instituições | Pode usar service role no backend | Sem service role; RPC + perfil | Segurança no cliente |
| PDF / recibos | jsPDF no browser | `expo-print` + `expo-sharing` | APIs nativas |
| Gráficos | Recharts | Listas + resumo numérico (`AdminDeliveriesChart` simplificado) | Paridade visual futura (Fase backlog) |
| Navegação | React Router | Expo Router + drawer | Plataforma |
| Auth storage | localStorage | `expo-secure-store` | Plataforma |
| Reset senha | URL web | Deep link `cesta-control-hub://` | Plataforma |
| Portal titular | Simulado (setTimeout) | RPC `audit_log` | Mobile já encaminha solicitações |
| Consentimento | PDF + upload (web) | Checkbox apenas (upload adiado) | Escopo acordado na Fase D |

**Hooks espelhados (mesma lógica Supabase):** `useFamilies`, `useDeliveries`, `useInstitutions`, `useAuditLog`, `useConsentManagement`, etc. Divergências intencionais estão comentadas no código (ex.: email Auth não atualizado no mobile).

---

## Fase F — Testes e publicação

### F.1 Testes

- [ ] Testar em **celular físico** (Expo Go)
- [ ] Testar em **celular físico** (APK via EAS preview)
- [ ] Fluxos críticos manuais:
  - [ ] Login admin e instituição
  - [ ] Registrar entrega com família bloqueada (justificativa)
  - [ ] Export CSV
  - [ ] Gerar e compartilhar recibo PDF
  - [ ] Logout e re-login

### F.2 Build nativo

- [ ] `npx expo prebuild`
- [ ] `npx expo run:android` (Android Studio)
- [ ] `eas build --profile preview --platform android`
- [ ] `eas build --profile production --platform android` (quando estável)

### F.3 Lojas

- [ ] Conta Google Play Developer
- [ ] Ícones, screenshots, descrição da loja
- [ ] Submissão Google Play
- [ ] (Opcional) iOS — conta Apple Developer + build iOS

---

## Backlog / melhorias futuras

- [ ] Gráficos completos com `victory-native` (paridade `DeliveriesChart`)
- [ ] Modo offline parcial (cache React Query)
- [ ] Notificações push (alertas de fraude)
- [ ] Biometria para reabrir sessão
- [ ] Testes automatizados (Detox ou Maestro)

---

## Critérios de “paridade com o web”

Conforme [PLANEJAMENTO_MOBILE.md §12](./PLANEJAMENTO_MOBILE.md#12-critérios-de-conclusão):

1. [ ] Admin e instituição acessam suas telas com as mesmas permissões
2. [ ] CRUD de instituições, famílias e entregas contra o mesmo Supabase
3. [ ] Regras de bloqueio e anti-fraude respeitadas (RPC `validate_delivery`)
4. [ ] Interface reconhecível (cores `#004E64`, Inter, logo, cards)
5. [ ] App publicável via EAS Build

---

## Comandos rápidos

```bash
cd mobile
npm run android          # Emulador Android (Expo Go)
npm start                # Metro — pressione "r" para recarregar
npx expo run:android     # Build nativo (após prebuild)
eas build --profile preview --platform android
```

---

## Histórico de progresso

| Data | Marco |
|------|-------|
| Jun 2026 | Fase 0–4 do planejamento: scaffold → MVP rodando no emulador |
| Jun 2026 | Fixes: Tailwind v3, `babel-preset-expo`, `useReportExport` async |
| Jun 2026 | Fase D: LGPD, deep link reset, portal titular, política completa |
| Jun 2026 | Fase E: `@cesta/shared`, hooks tipados, react-hook-form no FamilyWizard |
| — | Próximo: **Fase F** + refinamentos antes dos testes finais |
