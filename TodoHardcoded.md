# TodoHardcoded — itens hardcoded e riscos para outro agente

Documento de handoff para limpeza de valores fixos, bypasses de teste e seeds que não deveriam valer em produção.  
**Prioridade de correção sugerida:** banco (funções RLS) → migrations/seeds → frontend → docs.

---

## 1. Crítico — funções RLS com bypass (banco remoto)

> **Passo 1 desta sprint:** migration `20260722130000_harden_get_user_role.sql` remove fallbacks ativos.  
> Os perfis/UUIDs abaixo **continuam no banco** até limpeza manual — ver seção 2.

### `get_user_role(user_id uuid)`

| Item | Valor / comportamento | Risco |
|------|------------------------|-------|
| Fallback padrão | `RETURN 'institution'` quando UUID desconhecido ou sem perfil | Sessão nula/anônima era tratada como instituição |
| Bypass admin | UUID `d1e6f7a2-b3c4-5d6e-7f8a-9b0c1d2e3f40` | Admin sem consultar `profiles` |
| Bypass instituição | UUID `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | Instituição fictícia |
| NULL → institution (versão antiga) | Migration `20250805025407_*.sql` | Piora o fail-open |

**Onde está (histórico em migrations):**

- `supabase/migrations/20250803033502_8a1f16a3-1bb1-4115-80fc-d713d7edded3.sql`
- `supabase/migrations/20250803113250_9eed95de-d808-4d96-bba8-6c0c3e72b150.sql`
- `supabase/migrations/20250805025407_4ab9173f-dc0b-49b0-b6ab-8d5e3de8fd63.sql`

**Estado em produção (antes do hardening):** confirmado via MCP em jul/2026 — função ativa no projeto `eslfcjhnaojghzuswpgz`.

**Referência interna:** `docs/relatorio-seguranca.md` — achado **CJ-SEC-003** e **CJ-SEC-010**.

---

### `get_user_institution(user_id uuid)`

| Item | Valor | Risco |
|------|-------|-------|
| Bypass instituição | Se `user_id = a1b2c3d4-e5f6-7890-abcd-ef1234567890` → retorna `12345678-1234-1234-1234-123456789012` | Instituição de teste fixa sem `profiles` |

**Mesmas migrations acima.**

---

### `is_bypass_user(user_id uuid)`

| Item | Valor |
|------|-------|
| Lista fixa | `d1e6f7a2-...` (admin), `a1b2c3d4-...` (instituição) |

**Onde:** `supabase/migrations/20250803033502_*.sql`, `20250803113250_*.sql`  
**Frontend:** só tipagem em `src/integrations/supabase/types.ts` — **não há uso em `src/`**.

**Pós hardening:** função passa a retornar sempre `false` (compatibilidade de API). Considerar `DROP FUNCTION` se nada chamar via REST.

---

## 2. Crítico — seeds / profiles de bypass em migrations

Perfis inseridos com UUIDs previsíveis (podem existir no banco remoto):

| UUID | E-mail (migration) | Role | institution_id |
|------|-------------------|------|----------------|
| `d1e6f7a2-b3c4-5d6e-7f8a-9b0c1d2e3f40` | `admin@araguari.mg.gov.br` / `bypass-admin@araguari.mg.gov.br` | admin | NULL |
| `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | `instituicao@casaesperanca.org.br` / `bypass-instituicao@casaesperanca.org.br` | institution | `12345678-1234-1234-1234-123456789012` |

**Arquivos:**

- `supabase/migrations/20250805025407_4ab9173f-dc0b-49b0-b6ab-8d5e3de8fd63.sql` (linhas 5–30)
- `supabase/migrations/20250805030725_271f4f76-c144-41c1-892b-03daecfcd0ab.sql` (profiles bypass + instituição `12345678-...`)
- `supabase/migrations/20250804132101_c45233a1-86c2-49a5-af79-ca6a5841f91a.sql`
- `supabase/migrations/20250704164657-7af31bbb-3d7c-469f-86de-b5ac62030b5f.sql`

**Instituição fictícia de teste:** `12345678-1234-1234-1234-123456789012`  
Também em `supabase/migrations/20250809151202_bad6802d-5c9a-40d6-b1f0-a4b30a29ee0d.sql` (vínculos com famílias `11111111-...`, `22222222-...`, etc.).

**Ação sugerida para outro agente:**

1. Verificar no Supabase se esses UUIDs existem em `auth.users`, `profiles`, `institutions`.
2. Revogar sessões / desativar contas de bypass em produção.
3. Mover seeds para `supabase/seed.sql` ou script local **fora** do pipeline de produção.
4. Não re-aplicar migrations antigas de bypass em ambientes novos.

---

## 3. Alto — bootstrap admin acoplado a e-mail

| Item | Onde | Nota |
|------|------|------|
| RPC `bootstrap_admin(admin_email text)` | `supabase/migrations/20250811172312_878be703-1ca7-43c7-bed5-f9eb60bdd08a.sql` | Promove perfil a admin se ainda não existir admin |
| Chamada no login | `src/hooks/useAuth.tsx` — `VITE_ADMIN_SEED_EMAIL` | Só roda se env bater com e-mail do login |

**Risco:** se `EXECUTE` estiver aberto para `anon`/`authenticated` (ver CJ-SEC-004 no relatório), promoção indevida.  
**Ação:** restringir `GRANT EXECUTE`, validar caller dentro da função, remover chamada automática do client em produção.

---

## 4. Médio — identificadores de projeto / ambiente

| Item | Onde | Severidade |
|------|------|------------|
| `project_id = "eslfcjhnaojghzuswpgz"` | `supabase/config.toml` | Esperado para CLI; não é segredo |
| URL Supabase comentada | `.env.example` | OK como exemplo |
| Chaves reais | `.env`, `.env.local`, `mobile/.env` | **Não commitar** — já no `.gitignore` esperado |

---

## 5. Médio — RPCs com `GRANT EXECUTE` amplo (relatório CJ-SEC-004)

Funções `SECURITY DEFINER` com execução para `anon` + `authenticated` (confirmado no relatório, jul/2026):

- `export_family_data`, `find_family_by_cpf`, `decrypt_cpf`, `get_encryption_key`
- `delete_family_permanently`, `anonymize_family`, `associate_family_institution`
- `bootstrap_admin`, `audit_log`, `link_institution_user`, etc.

**Onde investigar:** migrations em `supabase/migrations/data_deletion_anonymization.sql`, `encrypt_cpf_field.sql`, grants no final de cada RPC.

**Ação:** revisar cada RPC — validação de `auth.uid()` + role + revogar `anon` onde não for necessário.

---

## 6. Baixo — documentação / fluxo bypass legado no frontend

Documentos descrevem bypass visual que **não aparece mais** em `src/` (grep limpo), mas podem confundir manutenção:

- `docs/AUTH_FLOW_ISSUES.md` — `localStorage.bypass_user`, botões bypass
- `docs/MVP_STATUS.md` — “Sistema de bypass para testes”
- `docs/tasks/agent-1-auth-fixes.md` — tarefas de bypass UI

**Ação:** atualizar ou arquivar docs; confirmar que login usa só Supabase Auth real.

---

## 7. Baixo — dados de teste usados manualmente (não no código)

Usados em testes manuais / MCP / conversas — **não hardcoded no repo**, mas aparecem em notas:

| Tipo | Exemplo |
|------|---------|
| Instituição origem (prod) | `e2f2ab21-b9ce-4f9b-97ae-d5af70721072` — Banco de Alimentos Araguari |
| Instituição teste | `eaaab164-b376-4c97-866b-a80d811e4d0d` — TESTE DESENVOLVIMENTO |
| Família multi-inst. | `86051b7b-f1ef-4e0d-b591-ea4790799747` (M 174) |
| Usuário teste | `teste@cestajusta.com` / profile `535374c9-fbcf-422a-80d2-84b6c93de71e` |

**Ação:** manter em fixtures de teste E2E locais ou variáveis de ambiente de staging — não em migrations de produção.

---

## 8. Checklist para o agente de limpeza

- [ ] Confirmar migration `20260722130000_harden_get_user_role.sql` aplicada em produção
- [ ] Auditar `auth.users` + `profiles` dos UUIDs da seção 2
- [ ] Remover/desativar contas bypass; rotacionar senhas se existirem
- [ ] Extrair seeds de teste para script local (`supabase/seed.dev.sql`)
- [ ] Revisar `GRANT EXECUTE` de RPCs sensíveis (CJ-SEC-004)
- [ ] Revisar `bootstrap_admin` (GRANT + lógica + chamada em `useAuth.tsx`)
- [ ] Atualizar docs legados de bypass (seção 6)
- [ ] Validar: `get_user_role(NULL)` → `NULL`; anon não lê tabelas privadas
- [ ] (Depois) `useDashboardStats` / `useDeliveries` — chamadas residuais a `families?select=*`

---

## Referências cruzadas

- `docs/relatorio-seguranca.md` — CJ-SEC-003, CJ-SEC-004, CJ-SEC-010
- `docs/REMEDIACAO_SEGURANCA_RUNBOOK.md` — seções B.4 e checklist bypass
- Migration desta correção: `supabase/migrations/20260722130000_harden_get_user_role.sql`
