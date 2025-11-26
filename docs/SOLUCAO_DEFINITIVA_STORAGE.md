# 🔧 Solução Definitiva: Erro de Upload no Storage

## ❌ Problema
Erro persiste mesmo após criar política de INSERT:
```
"new row violates row-level security policy"
statusCode: 403
```

## ✅ Solução Passo a Passo

### Passo 1: Verificar Políticas Globais

1. No Dashboard do Supabase, vá em **Storage** → **Policies**
2. Procure a seção **"OTHER POLICIES UNDER STORAGE.OBJECTS"**
3. **Se houver políticas lá, DELETE todas elas** (elas podem estar bloqueando)
4. Essas políticas globais têm precedência sobre políticas de bucket

### Passo 2: Criar Política Ultra-Permissiva

1. Vá em **Storage** → **Buckets** → **receipts** → **Policies**
2. **Delete qualquer política existente** no bucket receipts
3. Clique em **"New policy"**
4. Selecione **"Create a policy from scratch"**
5. Configure:
   - **Policy name:** `Permitir upload autenticado`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated`
   - **WITH CHECK expression:** Cole **EXATAMENTE** isso (sem aspas):
   ```sql
   true
   ```
   Isso permite QUALQUER upload de usuários autenticados, sem restrições.

6. Clique em **"Review"** e depois **"Save policy"**

### Passo 3: Verificar se Funcionou

1. Tente gerar um recibo novamente
2. Se funcionar, podemos depois restringir a política para ser mais segura
3. Se NÃO funcionar, continue para o Passo 4

### Passo 4: Se Ainda Não Funcionar - Desabilitar RLS Temporariamente

⚠️ **ATENÇÃO:** Isso é apenas para teste e diagnóstico!

1. Vá em **Storage** → **Buckets** → **receipts** → **Settings**
2. Procure por **"RLS (Row Level Security)"** ou **"Enable RLS"**
3. **Desabilite temporariamente** o RLS
4. Teste se o upload funciona
5. Se funcionar, o problema é nas políticas
6. **Reabilite o RLS** e ajuste as políticas

## 🔍 Diagnóstico

### Se funcionar com `true`:
- O problema era a política muito restritiva
- Podemos depois criar uma política mais específica:
  ```sql
  bucket_id = 'receipts'
  ```

### Se não funcionar mesmo com `true`:
- Pode haver políticas globais bloqueando
- Ou o RLS está configurado de forma diferente
- Verifique também se há políticas em "POLICIES UNDER STORAGE.BUCKETS"

### Se funcionar sem RLS:
- Confirma que o problema é nas políticas
- Precisamos ajustar as políticas RLS

## 📝 Nota Importante

A política com `true` é **muito permissiva** - permite qualquer upload de usuários autenticados. Depois que funcionar, podemos restringir para:
```sql
bucket_id = 'receipts'
```

Mas primeiro, vamos fazer funcionar!

