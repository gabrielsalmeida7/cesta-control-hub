# Correção do Erro de Upload no Storage

## Erro
```
"new row violates row-level security policy"
statusCode: 403
```

## Causa
Mesmo com o bucket público, as políticas RLS (Row Level Security) ainda são aplicadas. Se você criou políticas anteriormente, elas podem estar bloqueando o upload.

## Solução Rápida (Bucket Público)

### Opção 1: Remover Todas as Políticas (Mais Simples)

1. Acesse o Supabase Dashboard
2. Vá em **Storage** → **Buckets** → **receipts** → **Policies**
3. **Delete todas as políticas existentes**
4. Com bucket público e sem políticas, qualquer usuário autenticado pode fazer upload

### Opção 2: Criar Política de INSERT Simples

Se preferir manter políticas, crie uma política de INSERT mais simples:

1. Acesse **Storage** → **Buckets** → **receipts** → **Policies**
2. Clique em **New Policy**
3. Selecione **"Create a policy from scratch"**
4. Configure:
   - **Policy name:** `Permitir upload de recibos`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated`
   - **WITH CHECK expression:** Cole apenas:
   ```sql
   bucket_id = 'receipts'
   ```
5. Clique em **Review** e depois em **Save policy**

## Solução Completa (4 Políticas Simplificadas)

Se quiser manter controle completo, crie estas 4 políticas:

### Política 1: INSERT (Upload)
- **Nome:** `Permitir upload de recibos`
- **Operação:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK:**
```sql
bucket_id = 'receipts'
```

### Política 2: SELECT (Leitura)
- **Nome:** `Permitir leitura de recibos`
- **Operação:** `SELECT`
- **Target roles:** `authenticated`
- **USING:**
```sql
bucket_id = 'receipts'
```

### Política 3: UPDATE (Atualização)
- **Nome:** `Permitir atualização de recibos`
- **Operação:** `UPDATE`
- **Target roles:** `authenticated`
- **USING:**
```sql
bucket_id = 'receipts'
```

### Política 4: DELETE (Deleção)
- **Nome:** `Permitir deleção de recibos`
- **Operação:** `DELETE`
- **Target roles:** `authenticated`
- **USING:**
```sql
bucket_id = 'receipts'
```

## ⚠️ Importante

Com bucket **público** e políticas simples como acima:
- ✅ Qualquer usuário autenticado pode fazer upload
- ✅ Qualquer usuário autenticado pode ler (mas URLs públicas também funcionam)
- ✅ Menos seguro, mas mais simples

Se quiser mais segurança no futuro:
- Torne o bucket **privado**
- Use políticas mais restritivas (ver `STORAGE_POLICIES_SETUP.md`)

## Teste

Após criar/ajustar as políticas:
1. Tente gerar um recibo novamente
2. O upload deve funcionar
3. O PDF deve abrir automaticamente

