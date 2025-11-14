# Debug: Problema de Login de Instituição

## Problema
Erro 400 ao tentar fazer login com usuário de instituição recém-criado.

## Possíveis Causas

### 1. Usuário não foi criado corretamente
- Verificar se o usuário existe em `auth.users`
- Verificar se o perfil foi criado em `profiles`

### 2. Senha não foi definida corretamente
- Verificar se a senha foi passada corretamente para `createUser`
- Verificar se há algum problema com a API Admin

### 3. Email não confirmado
- Mesmo com `email_confirm: true`, pode haver problemas

## Scripts de Verificação

### Verificar se o usuário foi criado
```sql
-- Verificar usuário em auth.users
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'email_da_instituicao@exemplo.com';

-- Verificar perfil em profiles
SELECT id, email, role, institution_id, full_name
FROM profiles
WHERE email = 'email_da_instituicao@exemplo.com';

-- Verificar instituição
SELECT id, name, email, responsible_name
FROM institutions
WHERE email = 'email_da_instituicao@exemplo.com';
```

### Verificar se há problemas com a criação
```sql
-- Verificar se há usuários sem perfil
SELECT u.id, u.email, u.email_confirmed_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
AND u.email LIKE '%@%';

-- Verificar instituições sem usuário vinculado
SELECT i.id, i.name, i.email
FROM institutions i
WHERE i.email IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.email = i.email
);
```

## Solução Temporária

Se o usuário não foi criado corretamente, você pode:

1. **Criar manualmente via Dashboard:**
   - Acesse: https://supabase.com/dashboard/project/eslfcjhnaojghzuswpgz/auth/users
   - Clique em "Add user"
   - Preencha email e senha
   - Marque "Auto Confirm User"
   - Crie o usuário

2. **Vincular o usuário à instituição via SQL:**
   ```sql
   -- Substitua os valores abaixo
   UPDATE profiles
   SET institution_id = 'id_da_instituicao',
       role = 'institution',
       full_name = 'Nome do Responsável'
   WHERE email = 'email_da_instituicao@exemplo.com';
   ```

## Logs para Debug

Com as melhorias implementadas, você verá logs no console:
- `[CREATE_INSTITUTION] Creating user via Admin API`
- `[CREATE_INSTITUTION] User created successfully`
- `[AUTH] Supabase auth error` (se houver erro no login)

Verifique o console do navegador para ver esses logs e identificar onde está o problema.

