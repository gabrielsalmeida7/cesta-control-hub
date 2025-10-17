# BACKEND_TASKS.md

## Tarefas de Backend - Cesta Control Hub

**Versão:** 1.0.0  
**Última Atualização:** Janeiro 2025  
**Plataforma:** Supabase (PostgreSQL + Auth)

---

## 🎯 Visão Geral

Este documento define todas as tarefas de backend necessárias para completar o MVP do Cesta Control Hub. As tarefas incluem verificação do schema do banco, implementação de RLS, criação de funções auxiliares e validação de triggers.

---

## 🔴 PRIORIDADE CRÍTICA (Bloqueadores do MVP)

### 1. **Verificação do Schema do Banco de Dados**

#### 1.1 Verificar Tabelas Existentes

**Status:** ✅ Schema criado, precisa verificação

**Tarefas:**

- [ ] Verificar se todas as tabelas existem:
  - `institutions` ✅
  - `families` ✅
  - `profiles` ✅
  - `deliveries` ✅
  - `institution_families` ✅
- [ ] Verificar constraints e índices
- [ ] Validar relacionamentos entre tabelas
- [ ] Testar inserção de dados de teste

#### 1.2 Verificar Triggers Existentes

**Status:** ✅ Triggers criados, precisa validação

**Tarefas:**

- [ ] Testar trigger `on_delivery_created`
- [ ] Testar trigger `update_family_blocking`
- [ ] Verificar se triggers estão funcionando corretamente
- [ ] Validar cálculo de `blocked_until`

**SQL para Testar:**

```sql
-- Testar trigger de bloqueio automático
INSERT INTO deliveries (family_id, institution_id, blocking_period_days)
VALUES ('family-uuid', 'institution-uuid', 30);

-- Verificar se família foi bloqueada
SELECT is_blocked, blocked_until, blocked_by_institution_id
FROM families
WHERE id = 'family-uuid';
```

### 2. **Implementação de Row Level Security (RLS)**

#### 2.1 Políticas para Tabela `institutions`

**Status:** ❌ Não implementado

**Tarefas:**

- [ ] Habilitar RLS na tabela
- [ ] Criar política para admin (acesso total)
- [ ] Criar política para instituição (acesso apenas aos próprios dados)

**SQL Necessário:**

```sql
-- Habilitar RLS
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Política para admin
CREATE POLICY "Admin can manage all institutions" ON institutions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para instituição (apenas leitura dos próprios dados)
CREATE POLICY "Institution can view own data" ON institutions
FOR SELECT USING (
  id = (
    SELECT institution_id FROM profiles
    WHERE profiles.id = auth.uid()
  )
);
```

#### 2.2 Políticas para Tabela `families`

**Status:** ❌ Não implementado

**Tarefas:**

- [ ] Habilitar RLS na tabela
- [ ] Criar política para admin (acesso total)
- [ ] Criar política para instituição (acesso às famílias vinculadas)

**SQL Necessário:**

```sql
-- Habilitar RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Política para admin
CREATE POLICY "Admin can manage all families" ON families
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para instituição (famílias vinculadas)
CREATE POLICY "Institution can manage associated families" ON families
FOR ALL USING (
  id IN (
    SELECT family_id FROM institution_families
    WHERE institution_id = (
      SELECT institution_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
);
```

#### 2.3 Políticas para Tabela `deliveries`

**Status:** ❌ Não implementado

**Tarefas:**

- [ ] Habilitar RLS na tabela
- [ ] Criar política para admin (acesso total)
- [ ] Criar política para instituição (acesso às próprias entregas)

**SQL Necessário:**

```sql
-- Habilitar RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Política para admin
CREATE POLICY "Admin can manage all deliveries" ON deliveries
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para instituição
CREATE POLICY "Institution can manage own deliveries" ON deliveries
FOR ALL USING (
  institution_id = (
    SELECT institution_id FROM profiles
    WHERE profiles.id = auth.uid()
  )
);
```

#### 2.4 Políticas para Tabela `institution_families`

**Status:** ❌ Não implementado

**Tarefas:**

- [ ] Habilitar RLS na tabela
- [ ] Criar política para admin (acesso total)
- [ ] Criar política para instituição (acesso às próprias associações)

### 3. **Criação de Funções Auxiliares**

#### 3.1 Função `associate_family_institution`

**Status:** ❌ Não implementado

**Tarefas:**

- [ ] Criar função para vincular família a instituição
- [ ] Validar se família e instituição existem
- [ ] Prevenir duplicação de associações
- [ ] Retornar erro se associação já existe

**SQL Necessário:**

```sql
CREATE OR REPLACE FUNCTION associate_family_institution(
  p_family_id UUID,
  p_institution_id UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar se família existe
  IF NOT EXISTS (SELECT 1 FROM families WHERE id = p_family_id) THEN
    RETURN json_build_object('success', false, 'error', 'Família não encontrada');
  END IF;

  -- Verificar se instituição existe
  IF NOT EXISTS (SELECT 1 FROM institutions WHERE id = p_institution_id) THEN
    RETURN json_build_object('success', false, 'error', 'Instituição não encontrada');
  END IF;

  -- Verificar se associação já existe
  IF EXISTS (
    SELECT 1 FROM institution_families
    WHERE family_id = p_family_id AND institution_id = p_institution_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Associação já existe');
  END IF;

  -- Criar associação
  INSERT INTO institution_families (family_id, institution_id)
  VALUES (p_family_id, p_institution_id);

  RETURN json_build_object('success', true, 'message', 'Associação criada com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3.2 Função `can_deliver_to_family`

**Status:** ❌ Não implementado

**Tarefas:**

- [ ] Criar função para verificar se entrega é permitida
- [ ] Verificar se família está ativa
- [ ] Verificar se família está vinculada à instituição
- [ ] Retornar motivo se entrega não for permitida

**SQL Necessário:**

```sql
CREATE OR REPLACE FUNCTION can_deliver_to_family(
  p_family_id UUID,
  p_institution_id UUID
)
RETURNS JSON AS $$
DECLARE
  family_record families%ROWTYPE;
  is_associated BOOLEAN;
BEGIN
  -- Buscar dados da família
  SELECT * INTO family_record FROM families WHERE id = p_family_id;

  IF NOT FOUND THEN
    RETURN json_build_object('can_deliver', false, 'reason', 'Família não encontrada');
  END IF;

  -- Verificar se família está bloqueada
  IF family_record.is_blocked THEN
    RETURN json_build_object(
      'can_deliver', false,
      'reason', 'Família bloqueada até ' || family_record.blocked_until::text
    );
  END IF;

  -- Verificar se família está vinculada à instituição
  SELECT EXISTS (
    SELECT 1 FROM institution_families
    WHERE family_id = p_family_id AND institution_id = p_institution_id
  ) INTO is_associated;

  IF NOT is_associated THEN
    RETURN json_build_object('can_deliver', false, 'reason', 'Família não vinculada a esta instituição');
  END IF;

  RETURN json_build_object('can_deliver', true, 'reason', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3.3 Função `unblock_family`

**Status:** ❌ Não implementado

**Tarefas:**

- [ ] Criar função para desbloqueio manual
- [ ] Verificar se usuário é admin
- [ ] Registrar motivo do desbloqueio
- [ ] Atualizar status da família

**SQL Necessário:**

```sql
CREATE OR REPLACE FUNCTION unblock_family(
  p_family_id UUID,
  p_reason TEXT DEFAULT 'Desbloqueio manual pelo administrador'
)
RETURNS JSON AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Verificar se usuário é admin
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();

  IF user_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Apenas administradores podem desbloquear famílias');
  END IF;

  -- Verificar se família existe
  IF NOT EXISTS (SELECT 1 FROM families WHERE id = p_family_id) THEN
    RETURN json_build_object('success', false, 'error', 'Família não encontrada');
  END IF;

  -- Desbloquear família
  UPDATE families
  SET
    is_blocked = false,
    blocked_until = null,
    blocked_by_institution_id = null,
    block_reason = p_reason,
    updated_at = now()
  WHERE id = p_family_id;

  RETURN json_build_object('success', true, 'message', 'Família desbloqueada com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. **Validação de Triggers**

#### 4.1 Testar Trigger de Bloqueio Automático

**Status:** ✅ Criado, precisa validação

**Tarefas:**

- [ ] Criar script de teste
- [ ] Verificar se família é bloqueada após entrega
- [ ] Verificar se data de bloqueio está correta
- [ ] Verificar se instituição bloqueadora está registrada

**Script de Teste:**

```sql
-- Inserir dados de teste
INSERT INTO institutions (name, address, phone)
VALUES ('Test Institution', 'Test Address', '123456789');

INSERT INTO families (name, contact_person, members_count)
VALUES ('Test Family', 'Test Contact', 4);

-- Registrar entrega
INSERT INTO deliveries (family_id, institution_id, blocking_period_days)
VALUES (
  (SELECT id FROM families WHERE name = 'Test Family'),
  (SELECT id FROM institutions WHERE name = 'Test Institution'),
  30
);

-- Verificar se família foi bloqueada
SELECT
  name,
  is_blocked,
  blocked_until,
  blocked_by_institution_id,
  block_reason
FROM families
WHERE name = 'Test Family';
```

#### 4.2 Verificar Trigger de Atualização de Timestamps

**Status:** ✅ Criado, precisa validação

**Tarefas:**

- [ ] Testar atualização de `updated_at` em todas as tabelas
- [ ] Verificar se timestamp é atualizado corretamente
- [ ] Verificar se não há conflitos entre triggers

---

## 🟡 PRIORIDADE MÉDIA

### 5. **Funções de Estatísticas**

#### 5.1 Função `get_admin_stats`

**Status:** ❌ Não implementado

**Tarefas:**

- [ ] Criar função para estatísticas do admin
- [ ] Retornar contadores de instituições, famílias, entregas
- [ ] Incluir estatísticas de famílias bloqueadas
- [ ] Otimizar consultas com índices

**SQL Necessário:**

```sql
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
  total_institutions INTEGER;
  total_families INTEGER;
  total_deliveries INTEGER;
  blocked_families INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_institutions FROM institutions;
  SELECT COUNT(*) INTO total_families FROM families;
  SELECT COUNT(*) INTO total_deliveries FROM deliveries;
  SELECT COUNT(*) INTO blocked_families FROM families WHERE is_blocked = true;

  RETURN json_build_object(
    'total_institutions', total_institutions,
    'total_families', total_families,
    'total_deliveries', total_deliveries,
    'blocked_families', blocked_families
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 5.2 Função `get_institution_stats`

**Status:** ❌ Não implementado

**Tarefas:**

- [ ] Criar função para estatísticas da instituição
- [ ] Retornar dados específicos da instituição
- [ ] Incluir famílias atendidas e bloqueadas
- [ ] Incluir entregas do mês

### 6. **Índices de Performance**

#### 6.1 Índices para Consultas Frequentes

**Status:** ⚠️ Parcialmente implementado

**Tarefas:**

- [ ] Verificar índices existentes
- [ ] Criar índices para consultas de família por instituição
- [ ] Criar índices para consultas de entregas por data
- [ ] Criar índices para consultas de famílias bloqueadas

**SQL Necessário:**

```sql
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deliveries_institution_date
ON deliveries(institution_id, delivery_date DESC);

CREATE INDEX IF NOT EXISTS idx_families_blocked_status
ON families(is_blocked, blocked_until);

CREATE INDEX IF NOT EXISTS idx_institution_families_institution
ON institution_families(institution_id);

CREATE INDEX IF NOT EXISTS idx_institution_families_family
ON institution_families(family_id);
```

---

## 🟢 PRIORIDADE BAIXA

### 7. **Funções Avançadas**

#### 7.1 Função de Relatórios

**Tarefas:**

- [ ] Criar função para relatórios por período
- [ ] Implementar agregações por instituição
- [ ] Criar função para exportação de dados

#### 7.2 Função de Auditoria

**Tarefas:**

- [ ] Criar tabela de auditoria
- [ ] Implementar triggers de auditoria
- [ ] Criar função para consultar histórico

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### RLS Policies

- [ ] Habilitar RLS em todas as tabelas
- [ ] Criar políticas para admin
- [ ] Criar políticas para instituição
- [ ] Testar políticas com usuários diferentes

### Funções Auxiliares

- [ ] `associate_family_institution`
- [ ] `can_deliver_to_family`
- [ ] `unblock_family`
- [ ] `get_admin_stats`
- [ ] `get_institution_stats`

### Validação

- [ ] Testar triggers existentes
- [ ] Verificar índices de performance
- [ ] Testar todas as funções
- [ ] Validar RLS com dados reais

---

## 🔧 COMANDOS ÚTEIS

### Verificar Status do RLS

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Verificar Políticas Existentes

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Verificar Triggers Existentes

```sql
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Verificar Funções Existentes

```sql
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public';
```

---

## 🔗 DOCUMENTAÇÃO RELACIONADA

- **📄 [DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Schema completo e scripts
- **📄 [SUPABASE_INTEGRATION_GUIDE.md](./SUPABASE_INTEGRATION_GUIDE.md)** - Guia de integração
- **📄 [BUSINESS_RULES.md](./BUSINESS_RULES.md)** - Regras de negócio
- **📄 [API_INTEGRATION.md](./API_INTEGRATION.md)** - Padrões de API

---

## ⏱️ ESTIMATIVA DE TEMPO

| Tarefa                       | Complexidade | Tempo Estimado  |
| ---------------------------- | ------------ | --------------- |
| **Verificar Schema**         | Baixa        | 1-2 horas       |
| **Implementar RLS**          | Média        | 4-6 horas       |
| **Criar Funções Auxiliares** | Alta         | 6-8 horas       |
| **Validar Triggers**         | Média        | 2-4 horas       |
| **Criar Funções de Stats**   | Média        | 3-4 horas       |
| **Otimizar Índices**         | Baixa        | 1-2 horas       |
| **Total**                    | -            | **17-26 horas** |

---

**Prioridade:** 🔴 **Crítica** - Essencial para segurança e funcionalidade  
**Dependências:** Schema do banco, regras de negócio  
**Próximo Passo:** Implementar RLS policies primeiro
