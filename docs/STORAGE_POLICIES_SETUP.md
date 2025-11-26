# Configuração de Políticas de Storage para Bucket Receipts

## ⚠️ Importante

No Supabase, as políticas de storage **não podem ser criadas diretamente via SQL** no SQL Editor devido a restrições de permissão. Você precisa criar as políticas através do **Dashboard do Supabase**.

## 📋 Passo a Passo

### 1. Acesse o Dashboard do Supabase

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique em **Buckets**
5. Clique no bucket **`receipts`**

### 2. Criar Política 1: Upload de Recibos

1. Na página do bucket, clique na aba **Policies**
2. Clique em **New Policy**
3. Selecione **"Create a policy from scratch"**
4. Configure:
   - **Policy name:** `Usuários autenticados podem fazer upload de recibos`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated`
   - **WITH CHECK expression:** Cole o código abaixo:

```sql
bucket_id = 'receipts' AND
(storage.foldername(name))[1] = 'receipts'
```

5. Clique em **Review** e depois em **Save policy**

### 3. Criar Política 2: Leitura de Recibos

1. Clique em **New Policy** novamente
2. Selecione **"Create a policy from scratch"**
3. Configure:
   - **Policy name:** `Usuários podem ler recibos de sua instituição`
   - **Allowed operation:** `SELECT`
   - **Target roles:** `authenticated`
   - **USING expression:** Cole o código abaixo:

```sql
bucket_id = 'receipts' AND
(
  -- Admin pode ler todos os recibos
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Usuário de instituição pode ler apenas recibos de sua instituição
  EXISTS (
    SELECT 1 FROM public.receipts r
    JOIN public.profiles p ON p.institution_id = r.institution_id
    WHERE r.file_path = name
    AND p.id = auth.uid()
    AND p.role = 'institution'
  )
)
```

4. Clique em **Review** e depois em **Save policy**

### 4. Criar Política 3: Atualização de Recibos

1. Clique em **New Policy** novamente
2. Selecione **"Create a policy from scratch"**
3. Configure:
   - **Policy name:** `Usuários podem atualizar recibos de sua instituição`
   - **Allowed operation:** `UPDATE`
   - **Target roles:** `authenticated`
   - **USING expression:** Cole o código abaixo:

```sql
bucket_id = 'receipts' AND
(
  -- Admin pode atualizar todos os recibos
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Usuário de instituição pode atualizar apenas recibos de sua instituição
  EXISTS (
    SELECT 1 FROM public.receipts r
    JOIN public.profiles p ON p.institution_id = r.institution_id
    WHERE r.file_path = name
    AND p.id = auth.uid()
    AND p.role = 'institution'
  )
)
```

4. Clique em **Review** e depois em **Save policy**

### 5. Criar Política 4: Deleção de Recibos

1. Clique em **New Policy** novamente
2. Selecione **"Create a policy from scratch"**
3. Configure:
   - **Policy name:** `Usuários podem deletar recibos de sua instituição`
   - **Allowed operation:** `DELETE`
   - **Target roles:** `authenticated`
   - **USING expression:** Cole o código abaixo:

```sql
bucket_id = 'receipts' AND
(
  -- Admin pode deletar todos os recibos
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
  OR
  -- Usuário de instituição pode deletar apenas recibos de sua instituição
  EXISTS (
    SELECT 1 FROM public.receipts r
    JOIN public.profiles p ON p.institution_id = r.institution_id
    WHERE r.file_path = name
    AND p.id = auth.uid()
    AND p.role = 'institution'
  )
)
```

4. Clique em **Review** e depois em **Save policy**

## ✅ Verificação

Após criar todas as 4 políticas, você deve ver:

1. ✅ `Usuários autenticados podem fazer upload de recibos` (INSERT)
2. ✅ `Usuários podem ler recibos de sua instituição` (SELECT)
3. ✅ `Usuários podem atualizar recibos de sua instituição` (UPDATE)
4. ✅ `Usuários podem deletar recibos de sua instituição` (DELETE)

## 🔒 Como Funciona

### Upload (INSERT)
- Qualquer usuário autenticado pode fazer upload de arquivos no bucket `receipts`
- O arquivo deve estar na pasta `receipts/`

### Leitura (SELECT)
- **Admin:** Pode ler todos os recibos
- **Instituição:** Pode ler apenas recibos de sua própria instituição
- A verificação é feita através da tabela `receipts` e `profiles`

### Atualização (UPDATE)
- Mesmas regras de leitura
- Permite substituir arquivos existentes

### Deleção (DELETE)
- Mesmas regras de leitura
- Permite remover arquivos

## 🐛 Troubleshooting

### Erro: "Policy already exists"
- Se você tentar criar uma política que já existe, o Supabase mostrará um erro
- Nesse caso, edite a política existente ou delete e recrie

### Erro: "Permission denied" ao acessar arquivos
- Verifique se todas as 4 políticas foram criadas corretamente
- Verifique se o bucket está **privado** (não público)
- Verifique se o usuário está autenticado
- Verifique se o usuário pertence à instituição correta

### Erro: "Bucket not found"
- Certifique-se de que o bucket `receipts` existe
- Verifique se o nome está correto (case-sensitive)

## 📝 Notas

- As políticas são aplicadas automaticamente após serem salvas
- Não é necessário reiniciar o servidor
- As políticas funcionam em conjunto com URLs assinadas para máxima segurança
- Admin sempre tem acesso total (pode ler, atualizar e deletar todos os recibos)

