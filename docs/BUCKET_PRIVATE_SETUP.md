# Configuração do Bucket Privado para Recibos

Este documento explica como configurar o bucket `receipts` como privado e usar URLs assinadas para acesso seguro aos recibos.

## 📋 O que foi implementado

### 1. **Mudanças no Código**

- ✅ `uploadReceiptToStorage()` agora retorna apenas o `filePath` (não URL pública)
- ✅ Nova função `getSignedReceiptUrl()` para gerar URLs assinadas temporárias (expira em 1 hora)
- ✅ Hooks atualizados para usar URLs assinadas em vez de URLs públicas
- ✅ `useDownloadReceipt()` atualizado para gerar URL assinada sob demanda

### 2. **Segurança**

- ✅ Bucket deve ser **PRIVADO** (não público)
- ✅ URLs assinadas expiram em 1 hora
- ✅ Apenas usuários autenticados podem acessar
- ✅ Políticas RLS garantem que usuários só vejam recibos de sua instituição (admin vê todos)

## 🚀 Passos para Configuração

### Passo 1: Tornar o Bucket Privado

Você tem duas opções:

#### Opção A: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Storage** → **Buckets**
4. Clique no bucket `receipts`
5. Na aba **Settings**, desmarque a opção **"Public bucket"**
6. Clique em **Save**

#### Opção B: Via Código (Temporário)

1. Adicione o componente `MakeBucketPrivateButton` em alguma página temporariamente
2. Clique no botão para tornar o bucket privado
3. Remova o componente após usar

```tsx
// Exemplo de uso temporário
import { MakeBucketPrivateButton } from '@/components/admin/MakeBucketPrivateButton';

// Adicione em alguma página admin temporariamente
<MakeBucketPrivateButton />
```

### Passo 2: Criar Políticas RLS

⚠️ **IMPORTANTE:** No Supabase, políticas de storage não podem ser criadas via SQL diretamente. Você precisa criá-las através do Dashboard.

**Siga o guia completo:**
- 📖 [Guia de Configuração de Políticas de Storage](./STORAGE_POLICIES_SETUP.md)

**Resumo rápido:**
1. Acesse o Supabase Dashboard → Storage → Buckets → `receipts` → Policies
2. Crie 4 políticas usando os templates do arquivo `create_receipts_storage_policies.sql`
3. Cada política tem um nome, operação e expressão SQL específica

### Passo 3: Testar

1. Faça login no sistema
2. Gere um recibo (movimentação ou entrega)
3. O PDF deve abrir automaticamente em nova aba
4. A URL deve ser uma URL assinada (contém parâmetros de assinatura)
5. Tente acessar a URL após 1 hora - deve expirar

## 🔒 Como Funciona a Segurança

### URLs Assinadas

- **Tempo de expiração:** 1 hora (3600 segundos)
- **Geração:** Sob demanda quando necessário
- **Autenticação:** Requer usuário logado
- **Validação:** Supabase valida a assinatura antes de servir o arquivo

### Políticas RLS

As políticas garantem que:

1. **Upload:** Apenas usuários autenticados podem fazer upload
2. **Leitura:** 
   - Usuários de instituição veem apenas recibos de sua instituição
   - Admin vê todos os recibos
3. **Atualização/Deleção:** Mesmas regras de leitura

### Estrutura de Dados

- **`file_path`:** Salvo no banco (ex: `receipts/recibo-entrega-1234567890.pdf`)
- **`file_url`:** Não é mais salvo (fica `null`) porque URLs expiram
- **URL assinada:** Gerada sob demanda quando necessário

## 🐛 Troubleshooting

### Erro: "Bucket not found"
- Verifique se o bucket `receipts` existe no Supabase Storage
- Certifique-se de que o nome está correto (case-sensitive)

### Erro: "Permission denied"
- Verifique se as políticas RLS foram criadas corretamente
- Certifique-se de que o usuário está autenticado
- Verifique se o usuário pertence à instituição correta

### Erro: "URL assinada não foi gerada"
- Verifique se o bucket está privado (não público)
- Verifique se o `file_path` está correto
- Verifique se o usuário tem permissão para acessar o arquivo

### URLs não expiram
- Verifique se o bucket está realmente privado
- URLs públicas não expiram, apenas URLs assinadas

## 📝 Notas Importantes

1. **URLs antigas:** Se você já tinha recibos com URLs públicas salvas, elas não funcionarão mais após tornar o bucket privado. Os novos recibos usarão URLs assinadas.

2. **Performance:** URLs assinadas são geradas sob demanda, o que pode adicionar uma pequena latência. Isso é aceitável pela segurança adicional.

3. **Expiração:** URLs assinadas expiram em 1 hora. Se um usuário precisar acessar novamente, uma nova URL será gerada automaticamente.

4. **Admin:** Admins podem ver todos os recibos, independente da instituição.

## ✅ Checklist de Configuração

- [ ] Bucket `receipts` criado no Supabase Storage
- [ ] Bucket configurado como **PRIVADO** (não público)
- [ ] Migration SQL executada (políticas RLS)
- [ ] Teste de geração de recibo funcionando
- [ ] Teste de download de recibo funcionando
- [ ] Verificação de que URLs são assinadas (contêm parâmetros de assinatura)
- [ ] Verificação de que apenas usuários logados podem acessar

