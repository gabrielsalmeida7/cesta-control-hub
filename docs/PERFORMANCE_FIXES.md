# Correções de Performance - Warnings do Supabase

## 📋 Resumo

Este documento descreve as correções aplicadas para resolver **warnings de performance** identificados pelo Supabase Database Linter.

### Warnings Corrigidos

1. **Auth RLS Initialization Plan** (33 warnings)
2. **Multiple Permissive Policies** (muitos warnings)
3. **Duplicate Index** (4 warnings)

---

## 🔍 Problemas Identificados

### 1. Auth RLS Initialization Plan (auth_rls_initplan)

**Problema:** Políticas RLS estão reavaliando `auth.uid()` e funções `auth.*()` para cada linha processada, causando performance subótima em queries com muitas linhas.

**Impacto:**
- Queries lentas em tabelas grandes
- Overhead desnecessário em operações de leitura
- Escalabilidade comprometida

**Solução:** Usar subselects `(select auth.uid())` e `(select get_user_role((select auth.uid())))` para avaliar apenas uma vez por query.

**Exemplo:**

**Antes (ineficiente):**
```sql
CREATE POLICY "Admins can manage deliveries" ON public.deliveries
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
```

**Depois (otimizado):**
```sql
CREATE POLICY "Admins can manage deliveries" ON public.deliveries
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');
```

### 2. Multiple Permissive Policies

**Problema:** Múltiplas políticas permissivas para o mesmo role e ação causam avaliação redundante de políticas.

**Impacto:**
- Cada política é avaliada separadamente
- Overhead em queries complexas
- Performance degradada

**Solução:** Consolidar políticas usando `OR` em uma única política por operação.

**Exemplo:**

**Antes (2 políticas):**
```sql
CREATE POLICY "Admins can manage deliveries" ON public.deliveries
  FOR ALL USING ((select public.get_user_role((select auth.uid()))) = 'admin');

CREATE POLICY "Institution users can view own deliveries" ON public.deliveries
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'institution' 
    AND institution_id = (select public.get_user_institution((select auth.uid())))
  );
```

**Depois (1 política consolidada):**
```sql
CREATE POLICY "deliveries_select_policy" ON public.deliveries
  FOR SELECT USING (
    (select public.get_user_role((select auth.uid()))) = 'admin'
    OR (
      (select public.get_user_role((select auth.uid()))) = 'institution' 
      AND institution_id = (select public.get_user_institution((select auth.uid())))
    )
  );
```

### 3. Duplicate Index

**Problema:** Índices duplicados (mesma coluna, diferentes nomes) causam overhead desnecessário.

**Impacto:**
- Tempo de INSERT/UPDATE aumentado (cada índice precisa ser atualizado)
- Espaço em disco desperdiçado
- Manutenção mais complexa

**Solução:** Remover índices duplicados, mantendo apenas um (preferencialmente o mais descritivo).

**Índices removidos:**
- `idx_deliveries_family` (mantido `idx_deliveries_family_id`)
- `idx_deliveries_institution` (mantido `idx_deliveries_institution_id`)
- `idx_institution_families_family` (mantido `idx_institution_families_family_id`)
- `idx_institution_families_institution` (mantido `idx_institution_families_institution_id`)

---

## ✅ Soluções Implementadas

### Migration 1: `optimize_rls_policies_performance.sql`

**O que faz:**
- Otimiza todas as políticas RLS usando subselects
- Substitui `auth.uid()` por `(select auth.uid())`
- Substitui `get_user_role(auth.uid())` por `(select get_user_role((select auth.uid())))`
- Substitui `get_user_institution(auth.uid())` por `(select get_user_institution((select auth.uid())))`

**Tabelas afetadas:** Todas as 12 tabelas com políticas RLS

**Benefícios:**
- `auth.uid()` avaliado apenas uma vez por query
- Funções auxiliares avaliadas apenas uma vez
- Melhoria significativa em queries com muitas linhas

### Migration 2: `consolidate_rls_policies.sql`

**O que faz:**
- Consolida múltiplas políticas permissivas em políticas únicas
- Usa `OR` para combinar condições de diferentes roles
- Mantém mesma lógica de acesso, apenas otimizada

**Estratégia:**
- Para SELECT: consolidar políticas de admin e instituição
- Para INSERT/UPDATE: consolidar quando apropriado
- Manter políticas separadas quando faz sentido (ex: SELECT vs INSERT)

**Benefícios:**
- Menos políticas para avaliar por query
- Melhor performance em queries complexas
- Políticas mais fáceis de entender e manter

### Migration 3: `remove_duplicate_indexes.sql`

**O que faz:**
- Remove índices duplicados identificados
- Mantém índices com nomes mais descritivos
- Verifica existência antes de dropar

**Benefícios:**
- Menos overhead em operações de escrita
- Menos espaço em disco
- Manutenção mais simples

---

## 📝 Como Aplicar as Correções

### Passo 1: Backup

**IMPORTANTE:** Faça backup do banco de dados antes de aplicar as migrations.

```sql
-- No Supabase Dashboard, vá em Database > Backups
```

### Passo 2: Aplicar Migrations na Ordem

Execute as migrations na seguinte ordem:

1. **Primeiro:** `optimize_rls_policies_performance.sql`
   - Otimiza políticas usando subselects
   - Não muda lógica, apenas performance

2. **Segundo:** `consolidate_rls_policies.sql`
   - Consolida políticas múltiplas
   - **DEPENDE** da primeira migration (assume políticas otimizadas)

3. **Terceiro:** `remove_duplicate_indexes.sql`
   - Remove índices duplicados
   - Pode ser aplicado independentemente

### Passo 3: Verificar Correções

Execute queries de verificação:

```sql
-- Verificar políticas otimizadas
SELECT schemaname, tablename, policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (qual LIKE '%select auth.uid()%' OR qual LIKE '%select get_user_role%')
ORDER BY tablename, policyname;

-- Verificar políticas consolidadas
SELECT tablename, cmd, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

-- Verificar índices (não deve haver duplicados)
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('deliveries', 'institution_families')
  AND (indexname LIKE '%family%' OR indexname LIKE '%institution%')
ORDER BY tablename, indexname;
```

### Passo 4: Testar Performance

Teste queries comuns para verificar melhoria de performance:

**Como Admin:**
```sql
-- Deve ser mais rápido agora
SELECT * FROM public.deliveries LIMIT 100;
SELECT * FROM public.families LIMIT 100;
```

**Como Instituição:**
```sql
-- Deve ser mais rápido agora
SELECT * FROM public.deliveries LIMIT 100;
SELECT * FROM public.stock_movements LIMIT 100;
```

---

## ⚠️ Considerações Importantes

### Compatibilidade

- **Backward compatibility:** As mudanças não alteram a lógica de acesso, apenas otimizam
- **Testes necessários:** Verificar que acesso continua funcionando após aplicar migrations
- **Performance:** Espera-se melhoria significativa, especialmente em queries com muitas linhas

### Ordem de Aplicação

**CRÍTICO:** A migration `consolidate_rls_policies.sql` **DEVE** ser executada após `optimize_rls_policies_performance.sql`, pois assume que as políticas já estão otimizadas com subselects.

### Rollback

Cada migration pode ser revertida:

1. **optimize_rls_policies_performance.sql:** Recriar políticas sem subselects
2. **consolidate_rls_policies.sql:** Recriar políticas separadas
3. **remove_duplicate_indexes.sql:** Recriar índices removidos

---

## 🎯 Resultado Esperado

Após aplicar as correções:

- ✅ **0 warnings** de auth_rls_initplan
- ✅ **0 warnings** de multiple_permissive_policies
- ✅ **0 warnings** de duplicate_index
- ✅ Melhoria significativa de performance em queries RLS
- ✅ Políticas mais eficientes e fáceis de manter
- ✅ Índices otimizados sem duplicação

---

## 📊 Impacto Esperado na Performance

### Antes das Correções

- `auth.uid()` avaliado N vezes (N = número de linhas)
- Múltiplas políticas avaliadas por query
- Índices duplicados atualizados em cada INSERT/UPDATE

### Depois das Correções

- `auth.uid()` avaliado 1 vez por query
- Políticas consolidadas avaliadas uma vez
- Apenas índices necessários atualizados

**Melhoria estimada:** 50-90% em queries com muitas linhas (>1000 linhas)

---

## 📚 Referências

- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL RLS Best Practices](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)

---

## 🔧 Troubleshooting

### Problema: "permission denied" após aplicar migrations

**Causa:** Políticas consolidadas podem ter lógica diferente.

**Solução:** Verificar políticas consolidadas e ajustar se necessário:
```sql
SELECT * FROM pg_policies WHERE tablename = 'nome_da_tabela';
```

### Problema: Performance não melhorou

**Causa:** Pode haver outros gargalos (índices faltando, queries mal otimizadas).

**Solução:** 
1. Verificar se migrations foram aplicadas corretamente
2. Analisar planos de execução das queries
3. Verificar se há índices adequados

### Problema: Índice não encontrado ao dropar

**Causa:** Índice pode já ter sido removido ou não existir.

**Solução:** A migration usa `IF EXISTS`, então não causará erro. Verificar logs para confirmar.

---

**Última atualização:** 2025-01-XX  
**Status:** ✅ Implementado e pronto para aplicação

