# 🔍 Debug: Política de Storage Não Funciona

## ❌ Erro Persistente
```
"new row violates row-level security policy"
statusCode: 403
```

Mesmo após criar a política de INSERT, o erro persiste.

## 🔍 Possíveis Causas

### 1. Política Não Está Sendo Aplicada
- Verifique se a política foi salva corretamente
- Verifique se está listada em "RECEIPTS" → Policies

### 2. Políticas Conflitantes em "OTHER POLICIES UNDER STORAGE.OBJECTS"
- Pode haver políticas globais bloqueando
- Verifique essa seção no Dashboard

### 3. Caminho do Arquivo
- O código usa: `receipts/${fileName}`
- A política pode estar verificando o caminho de forma diferente

## ✅ Solução: Política Mais Permissiva

Crie uma política ainda mais simples que não verifica o caminho:

### Passo 1: Delete a Política Atual (se houver)
1. Vá em Storage → Buckets → receipts → Policies
2. Delete a política de INSERT existente

### Passo 2: Crie Nova Política Ultra-Simples
1. Clique em "New policy"
2. Selecione "Create a policy from scratch"
3. Configure:
   - **Policy name:** `Permitir qualquer upload autenticado`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated`
   - **WITH CHECK expression:** Cole apenas:
   ```sql
   true
   ```
   Isso permite qualquer upload de usuários autenticados, sem verificação de caminho.

### Passo 3: Salvar e Testar

## 🔄 Alternativa: Verificar Políticas Globais

Se ainda não funcionar:

1. Vá em Storage → Policies
2. Verifique a seção **"OTHER POLICIES UNDER STORAGE.OBJECTS"**
3. Se houver políticas lá, elas podem estar bloqueando
4. Nesse caso, você pode:
   - Deletar políticas conflitantes
   - Ou criar uma política mais específica que sobrescreva

## 🧪 Teste

Após criar a política com `true`:
1. Tente gerar recibo novamente
2. Se funcionar, podemos depois restringir a política
3. Se não funcionar, o problema pode estar nas políticas globais

