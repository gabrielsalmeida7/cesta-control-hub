# Correções de Segurança - Alertas do Supabase

## 📋 Resumo

Este documento descreve as correções aplicadas para resolver **18 alertas de segurança** identificados pelo Supabase Database Linter.

### Alertas Corrigidos

1. **Security Definer Views** (6 views)
2. **RLS Desabilitado** (12 tabelas)

---

## 🔍 Problemas Identificados

### 1. Security Definer Views

**Problema:** Views criadas com `SECURITY DEFINER` executam com as permissões do criador da view, não do usuário que a consulta. Isso pode:
- Bypassar Row Level Security (RLS) das tabelas subjacentes
- Permitir acesso não autorizado a dados
- Causar problemas de auditoria e rastreamento

**Views afetadas:**
- `families_with_cpf`
- `consent_audit`
- `audit_critical_actions`
- `audit_data_access`
- `audit_by_user`
- `families_eligible_for_deletion`

### 2. RLS Desabilitado

**Problema:** Tabelas públicas sem Row Level Security (RLS) permitem que qualquer usuário autenticado acesse/modifique qualquer linha, causando:
- Risco de vazamento de dados pessoais (violação LGPD)
- Falta de isolamento entre instituições
- Exposição de dados sensíveis (CPF, endereços)

**Tabelas afetadas:**
- `institution_families`
- `profiles`
- `institutions`
- `stock_movements`
- `suppliers`
- `products`
- `inventory`
- `deliveries`
- `receipts`
- `consent_change_log`
- `families`

---

## ✅ Soluções Implementadas

### Migration 1: `fix_security_definer_views.sql`

**O que faz:**
- Recria as 6 views sem `SECURITY DEFINER`
- Mantém a funcionalidade original
- Garante que RLS das tabelas subjacentes seja respeitado

**Views recriadas:**
- `families_with_cpf` - Continua descriptografando CPF apenas para admin
- `consent_audit` - View simples de auditoria de consentimento
- `audit_critical_actions` - Ações críticas de auditoria
- `audit_data_access` - Log de acessos a dados pessoais (LGPD Art. 37)
- `audit_by_user` - Estatísticas de auditoria por usuário
- `families_eligible_for_deletion` - Famílias elegíveis para exclusão

**Nota importante:** As views ainda podem usar funções `SECURITY DEFINER` (como `get_user_role()`, `decrypt_cpf()`), mas a view em si não é `SECURITY DEFINER`, permitindo que o RLS seja respeitado.

### Migration 2: `enable_rls_all_tables.sql`

**O que faz:**
- Habilita RLS em todas as 11 tabelas públicas
- Cria políticas adequadas baseadas em:
  - Role do usuário (admin vs institution)
  - Associação instituição-família
  - Propriedade dos dados

**Políticas criadas:**

#### Padrão Admin
- Admin pode gerenciar todas as linhas (`FOR ALL`)

#### Padrão Instituição
- Instituição pode ver apenas dados próprios (`FOR SELECT`)
- Instituição pode criar/atualizar apenas para si mesma (`FOR INSERT/UPDATE`)

#### Tabelas Específicas

**stock_movements:**
- Admin: acesso total
- Instituição: ver/criar/atualizar apenas próprias movimentações

**suppliers:**
- Admin: acesso total
- Instituição: apenas visualização (para seleção em movimentações)

**products:**
- Admin: acesso total
- Todos autenticados: visualização (para seleção em estoque/entregas)

**inventory:**
- Admin: acesso total
- Instituição: ver/gerenciar apenas próprio estoque

**receipts:**
- Admin: acesso total
- Instituição: ver/criar apenas próprios recibos

**consent_change_log:**
- Admin: visualização total
- Instituição: visualização apenas de logs relacionados às famílias atendidas
- INSERT apenas via triggers/funções SECURITY DEFINER

---

## 📝 Como Aplicar as Correções

### Passo 1: Backup

**IMPORTANTE:** Faça backup do banco de dados antes de aplicar as migrations.

```sql
-- No Supabase Dashboard, vá em Database > Backups
-- Ou use pg_dump se tiver acesso direto ao PostgreSQL
```

### Passo 2: Aplicar Migrations

Execute as migrations na seguinte ordem:

1. **Primeiro:** `fix_security_definer_views.sql`
   - Recria as views sem SECURITY DEFINER
   - Não afeta dados existentes

2. **Segundo:** `enable_rls_all_tables.sql`
   - Habilita RLS em todas as tabelas
   - Cria políticas de acesso
   - **ATENÇÃO:** Pode bloquear acesso se políticas não estiverem corretas

### Passo 3: Verificar Correções

Execute o script de verificação:

```sql
-- Execute: verify_security_fixes.sql
-- Verifique se:
-- ✅ Todas as tabelas têm RLS habilitado
-- ✅ Todas as tabelas têm políticas criadas
-- ✅ Views foram recriadas corretamente
```

### Passo 4: Testar Acesso

Teste o acesso como diferentes tipos de usuário:

**Como Admin:**
```sql
-- Deve retornar todas as linhas
SELECT * FROM public.families LIMIT 5;
SELECT * FROM public.institutions LIMIT 5;
SELECT * FROM public.stock_movements LIMIT 5;
```

**Como Instituição:**
```sql
-- Deve retornar apenas dados próprios
SELECT * FROM public.families LIMIT 5; -- Apenas famílias associadas
SELECT * FROM public.institutions LIMIT 5; -- Apenas própria instituição
SELECT * FROM public.stock_movements LIMIT 5; -- Apenas próprias movimentações
```

---

## ⚠️ Considerações Importantes

### Performance

Políticas RLS podem impactar performance. Certifique-se de que existem índices nas colunas usadas pelas políticas:

- `institution_id` - usado em várias políticas
- `user_id` / `created_by_user_id` - usado em políticas de propriedade
- `family_id` - usado em associações

**Verificar índices:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (indexdef LIKE '%institution_id%' OR indexdef LIKE '%user_id%');
```

### Compatibilidade com Código Existente

Se o código frontend/backend assumir acesso sem RLS, pode ser necessário ajustar:

1. **Queries diretas:** Verificar se queries assumem acesso total
2. **Testes:** Atualizar testes para considerar RLS
3. **Service Role:** Lembre-se que `service_role` key bypassa RLS (usar apenas server-side)

### Funções SECURITY DEFINER

As seguintes funções **devem permanecer** `SECURITY DEFINER` para funcionar em políticas RLS:

- `get_user_role(user_id)` - Retorna role do usuário
- `get_user_institution(user_id)` - Retorna instituição do usuário
- `decrypt_cpf(encrypted_cpf)` - Descriptografa CPF (apenas admin)
- `encrypt_cpf(cpf)` - Criptografa CPF

Essas funções são necessárias porque precisam acessar dados que podem estar protegidos por RLS.

---

## 🎯 Resultado Esperado

Após aplicar as correções:

- ✅ **0 alertas** de Security Definer Views
- ✅ **0 alertas** de RLS Desabilitado
- ✅ Todas as tabelas públicas com RLS habilitado
- ✅ Políticas adequadas para cada tabela
- ✅ Views respeitando RLS das tabelas subjacentes
- ✅ Conformidade com LGPD (proteção de dados pessoais)
- ✅ Isolamento adequado entre instituições

---

## 📚 Referências

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createview.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [LGPD - Lei Geral de Proteção de Dados](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

---

## 🔧 Troubleshooting

### Problema: "permission denied for table"

**Causa:** RLS está habilitado mas não há políticas que permitam acesso.

**Solução:** Verificar se as políticas foram criadas corretamente:
```sql
SELECT * FROM pg_policies WHERE tablename = 'nome_da_tabela';
```

### Problema: Views não retornam dados

**Causa:** Views podem estar respeitando RLS mas usuário não tem acesso às tabelas base.

**Solução:** Verificar políticas das tabelas subjacentes e garantir que usuário tem acesso.

### Problema: Performance degradada

**Causa:** Políticas RLS sem índices adequados.

**Solução:** Criar índices nas colunas usadas pelas políticas (`institution_id`, `user_id`, etc.).

---

## 📞 Suporte

Se encontrar problemas ao aplicar as correções:

1. Verifique os logs do Supabase Dashboard
2. Execute o script `verify_security_fixes.sql`
3. Revise as políticas criadas com `SELECT * FROM pg_policies`
4. Teste acesso como diferentes tipos de usuário

---

**Última atualização:** 2025-01-XX  
**Status:** ✅ Implementado e pronto para aplicação


