# 🚀 Criar Política de INSERT para Bucket Receipts

## ⚠️ Problema
Mesmo com bucket público e sem políticas, o Supabase **bloqueia tudo por padrão** quando RLS está habilitado. É necessário criar pelo menos uma política de INSERT.

## ✅ Solução: Criar Política de INSERT

### Passo 1: Acesse o Dashboard
1. Vá para [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. **Storage** → **Buckets** → **receipts** → **Policies**

### Passo 2: Criar Nova Política
1. Clique no botão **"New policy"** (ao lado de "RECEIPTS")
2. Selecione **"Create a policy from scratch"**

### Passo 3: Configurar a Política
Preencha os campos:

- **Policy name:** `Permitir upload de recibos`
- **Allowed operation:** Selecione `INSERT`
- **Target roles:** Selecione `authenticated`
- **WITH CHECK expression:** Cole exatamente isso:
  ```sql
  bucket_id = 'receipts'
  ```

### Passo 4: Salvar
1. Clique em **"Review"**
2. Clique em **"Save policy"**

## ✅ Pronto!

Agora você deve ver:
- ✅ Uma política listada em "RECEIPTS"
- ✅ Nome: "Permitir upload de recibos"
- ✅ Operação: INSERT

## 🧪 Teste

1. **Não precisa fazer nova entrega!** 
2. Tente gerar um recibo novamente (use o botão de download na tabela de movimentações)
3. Deve funcionar agora! ✅

## 📝 Nota Importante

Mesmo que o bucket seja **público**, você **precisa** de uma política de INSERT para permitir uploads. O bucket público apenas permite acesso de leitura sem autenticação, mas uploads ainda precisam de políticas RLS.

## 🔍 Se Ainda Não Funcionar

Verifique também a seção **"OTHER POLICIES UNDER STORAGE.OBJECTS"**:
1. Se houver políticas lá, elas podem estar bloqueando
2. Nesse caso, você pode precisar criar políticas mais específicas ou ajustar as existentes

