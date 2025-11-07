# Limpeza de Usuários SQL e Setup para Dashboard Users

## Status Atual

- ✅ Problema identificado: Users criados via SQL não funcionam com Auth service
- ✅ Solução encontrada: Criar users via Supabase Dashboard
- ✅ Logs analisados: Confirmam que `user_id: null` (usuário não encontrado)

---

## Passo 1: Remover Usuários SQL Antigos

Execute este SQL no Supabase Dashboard → SQL Editor:

```sql
-- DELETAR USUÁRIOS ANTIGOS (criados via SQL)
DELETE FROM profiles
WHERE email IN (
  'admin@araguari.mg.gov.br',
  'instituicao@casesperanca.org.br'
);

DELETE FROM auth.users
WHERE email IN (
  'admin@araguari.mg.gov.br',
  'instituicao@casesperanca.org.br'
);

-- Verificar se foram deletados
SELECT COUNT(*) as usuarios_restantes FROM auth.users;
```

---

## Passo 2: Criar Novos Usuários via Dashboard

### Novo Usuário Admin

1. Supabase Dashboard → **Authentication** → **Users**
2. Clique em **"Add user"**
3. Preencha:
   - **Email**: `teste@admin.com` (ou outro que preferir)
   - **Password**: `senha123` (ou outra)
   - **Auto Confirm User**: ✅ Marque
4. Clique **"Create user"**

### Novo Usuário Instituição

1. Repita o processo com:
   - **Email**: `teste@instituicao.com`
   - **Password**: `senha123`

---

## Passo 3: Criar Perfis Correspondentes

Execute este SQL após criar os usuários via Dashboard:

```sql
-- CRIAR PERFIL DO NOVO ADMIN
INSERT INTO profiles (id, email, full_name, role)
SELECT
  id,
  email,
  'Admin Teste',
  'admin'::user_role
FROM auth.users
WHERE email = 'teste@admin.com'
ON CONFLICT DO NOTHING;

-- CRIAR PERFIL DA NOVA INSTITUIÇÃO
INSERT INTO profiles (id, email, full_name, role, institution_id)
SELECT
  id,
  email,
  'Instituição Teste',
  'institution'::user_role,
  (SELECT id FROM institutions LIMIT 1)
FROM auth.users
WHERE email = 'teste@instituicao.com'
ON CONFLICT DO NOTHING;

-- VERIFICAR SE FORAM CRIADOS
SELECT id, email, role FROM profiles WHERE email LIKE 'teste%';
```

---

## Passo 4: Testar Login

1. Vá para frontend: `http://localhost:5173`
2. Tente fazer login com:
   - **Email**: `teste@admin.com`
   - **Senha**: `senha123`
3. Se funcionar → ✅ **Auth está consertado!**
4. Se não funcionar → Verifique logs novamente

---

## Checklist

- [ ] Deletei usuários antigos via SQL
- [ ] Criei novo user admin via Dashboard
- [ ] Criei novo user instituição via Dashboard
- [ ] Executei script para criar perfis
- [ ] Testei login no frontend
- [ ] Login funcionou ✅

---

**Credenciais de Teste (após criar via Dashboard)**

| Tipo        | Email                   | Senha      |
| ----------- | ----------------------- | ---------- |
| Admin       | `teste@admin.com`       | `senha123` |
| Instituição | `teste@instituicao.com` | `senha123` |

---

**Próximo Passo**: Após login funcionar, testar todas as operações CRUD com dados reais!
