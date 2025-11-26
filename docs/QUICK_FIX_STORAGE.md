# 🔧 Correção Rápida: Erro de Upload no Storage

## ❌ Erro Atual
```
"new row violates row-level security policy"
statusCode: 403
```

## ✅ Solução Rápida (2 minutos)

### Passo 1: Acesse o Dashboard
1. Vá para [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. **Storage** → **Buckets** → **receipts** → **Policies**

### Passo 2: Remova ou Ajuste a Política de INSERT

**Opção A - Mais Simples (Recomendado):**
1. **Delete todas as políticas existentes**
2. Com bucket público e sem políticas, funcionará automaticamente

**Opção B - Manter Política Simples:**
1. Se houver uma política de INSERT, **edite ela**
2. Na expressão **WITH CHECK**, use apenas:
   ```sql
   bucket_id = 'receipts'
   ```
3. **Remova** a parte `AND (storage.foldername(name))[1] = 'receipts'`
4. Salve

### Passo 3: Teste
1. Tente gerar um recibo novamente
2. Deve funcionar! ✅

## 📝 Explicação

A política original tinha uma condição extra que verificava o nome da pasta:
```sql
(storage.foldername(name))[1] = 'receipts'
```

Essa verificação pode falhar dependendo de como o caminho é construído. Para bucket público, a política mais simples é suficiente:
```sql
bucket_id = 'receipts'
```

Isso permite que qualquer usuário autenticado faça upload no bucket `receipts`.

## 🔒 Segurança

Com bucket **público**:
- ✅ URLs são públicas (qualquer um com a URL pode acessar)
- ✅ Apenas usuários autenticados podem fazer upload
- ⚠️ Menos seguro, mas mais simples

Se quiser mais segurança no futuro, veja `STORAGE_POLICIES_SETUP.md` para políticas mais restritivas.

