# Supabase Setup Checklist

## 🚨 CRITICAL - MUST DO NOW: Disable RLS (106s Timeout Fix)

**Status**: RLS policies are causing login to timeout after 106 seconds

**Action**: Execute SQL to disable RLS

**Time**: 2 minutes

### Steps:

1. **Go to SQL Editor**:

   - https://app.supabase.com/project/eslfcjhnaojghzuswpgz/sql/new

2. **Copy entire SQL block from** `docs/RLS_POLICY_FIX.md`

3. **Click into editor** and paste

4. **Click "Run"** or press **Ctrl+Enter**

5. **Wait for success** (you should see "queries executed successfully")

6. **Close editor**

7. **Go to frontend**, press **F5** to refresh

8. **Try login** with: `teste@admin.com` / `senha123`

9. **Expected**: Login within 2 seconds, redirects to dashboard ✅

### If It Works:

🎉 **VICTORY!** Continue to next steps below

### If It Still Doesn't Work:

1. Check browser **Console tab** for errors
2. Check Supabase **Auth logs**
3. Report the specific error message

---

## ✅ Setup Progress

- [ ] **CRITICAL: Disable RLS** (DO THIS FIRST)
- [ ] Test login speed
- [ ] Test institution dashboard
- [ ] Test admin dashboard
- [ ] Test CRUD operations (families)
- [ ] Test CRUD operations (institutions)
- [ ] Test CRUD operations (deliveries)
- [ ] Verify blocking works
- [ ] Verify statistics calculate

---

## Full Setup Steps (After RLS Fix)

### 1. Create Test Users (Via Dashboard)

**If users don't exist yet**:

1. Go to: https://app.supabase.com/project/eslfcjhnaojghzuswpgz/auth/users
2. Click "Add user"
3. Create admin user:
   - Email: `teste@admin.com`
   - Password: `senha123`
   - Click "Save user"
4. Create institution user:
   - Email: `instituicao@teste.com`
   - Password: `senha456`
   - Click "Save user"

### 2. Create User Profiles (Via SQL)

Run in SQL Editor:

```sql
-- Create admin profile
INSERT INTO public.profiles (id, email, full_name, role, institution_id)
SELECT
  id,
  email,
  'Teste Admin',
  'admin',
  NULL
FROM auth.users
WHERE email = 'teste@admin.com'
ON CONFLICT (id) DO UPDATE SET full_name = 'Teste Admin';

-- Create institution profile
INSERT INTO public.profiles (id, email, full_name, role, institution_id)
SELECT
  id,
  email,
  'Teste Instituição',
  'institution',
  (SELECT id FROM institutions LIMIT 1)
FROM auth.users
WHERE email = 'instituicao@teste.com'
ON CONFLICT (id) DO UPDATE SET full_name = 'Teste Instituição';
```

### 3. Test Login

1. Go to frontend: http://localhost:5173
2. Login with `teste@admin.com` / `senha123`
3. Should redirect to admin dashboard
4. Check sidebar shows "Admin" role

### 4. Test Institution Dashboard

1. Logout
2. Login with `instituicao@teste.com` / `senha456`
3. Should redirect to institution dashboard
4. Check sidebar shows "Instituição" role

### 5. Test CRUD - Create Family

1. Go to "Famílias" page
2. Click "Adicionar Nova Família"
3. Fill form:
   - Nome: "Família Teste"
   - CPF: "12345678901"
4. Click "Adicionar"
5. Family should appear in list

### 6. Test CRUD - Edit Family

1. Find the family you just created
2. Click "Editar"
3. Change name to "Família Teste Atualizada"
4. Click "Atualizar"
5. List should update

### 7. Test CRUD - Create Institution

1. Go to "Instituições" page
2. Click "Adicionar Nova Instituição"
3. Fill form:
   - Nome: "Instituição Teste"
   - Email: "teste@inst.com"
4. Click "Adicionar"
5. Institution should appear in list

### 8. Test Blocking Flow

1. Go to "Entregas" page
2. Select institution and family
3. Set blocking period: 30 days
4. Click "Registrar Entrega"
5. Go to Famílias page
6. Family should show as "Bloqueada"
7. Click "Desbloquear"
8. Family should show as "Ativa"

### 9. Test Statistics

1. Go to admin dashboard
2. Check cards show correct numbers:
   - Total Instituições
   - Total Famílias
   - Famílias Bloqueadas
3. Go to institution dashboard
4. Check stats for that institution only

### 10. Test Navigation

- [x] Login redirects correctly
- [ ] Sidebar shows correct role
- [ ] Nav buttons work
- [ ] Logout works
- [ ] Refresh doesn't auto-login
- [ ] Protected routes work

---

## Database Verification

Run these to verify setup:

```sql
-- Check users
SELECT id, email, created_at FROM auth.users;

-- Check profiles
SELECT id, email, role, institution_id FROM profiles;

-- Check institutions
SELECT id, name, email FROM institutions;

-- Check families
SELECT id, name, is_blocked, blocked_until FROM families;

-- Check deliveries
SELECT id, family_id, institution_id, delivery_date, blocking_period_days FROM deliveries;
```

---

## Common Issues

### Issue: "Invalid login credentials"

**Solution**:

1. Verify user exists in Auth → Users
2. Check profiles table has matching record
3. Check role is `admin` or `institution`

### Issue: "No institutions"

**Solution**:

1. Add institution via UI or SQL:
   ```sql
   INSERT INTO institutions (name, email)
   VALUES ('Instituição Padrão', 'default@inst.com');
   ```

### Issue: "Statistics show zero"

**Solution**:

1. Check useDashboardStats hook
2. Verify queries can read tables (RLS disabled)
3. Check data exists in tables

---

## MVP Features Checklist

- [ ] Admin can login
- [ ] Institution can login
- [ ] Admin sees admin dashboard
- [ ] Institution sees institution dashboard
- [ ] Can create families
- [ ] Can edit families
- [ ] Can create institutions
- [ ] Can register deliveries
- [ ] Families auto-block after delivery
- [ ] Statistics calculate correctly
- [ ] Logout works
- [ ] Frontend has detailed logs (dev only)

---

**After all steps complete**: MVP is ready for testing! 🚀
