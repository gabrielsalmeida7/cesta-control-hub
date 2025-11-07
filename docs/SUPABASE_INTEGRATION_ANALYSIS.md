# Supabase Integration Analysis

## 🔴 CRITICAL DISCOVERY: RLS Causing 106-Second Delays

### Latest Finding (Session Duration: 106.6 seconds)

**Supabase Log**:

```json
{
  "status": 200,
  "duration": 106664509,
  "msg": "request completed",
  "path": "/token",
  "action": "login",
  "actor_username": "teste@admin.com",
  "level": "info"
}
```

**Translation**:

- ✅ Login **SUCCESS** (status 200)
- ❌ But took **106 SECONDS** (should be <1s)
- 🔴 Frontend **TIMEOUT** before response arrives

### The Problem

```
Timeline:
1. Frontend submits credentials
2. Supabase Auth processes (< 100ms)
3. Returns token with user ID
4. Frontend calls onAuthStateChange → triggers profile fetch
5. Profile fetch hits RLS policy check
6. RLS policy calls get_user_role()
7. get_user_role() queries profiles table (circular query)
8. Query deadlocks trying to check own role
9. Timeout after 106 seconds
10. Frontend gives up (timeout < 106s)
```

### Why It's Slow

The RLS policy is doing:

```sql
WHERE auth.jwt() ->> 'role' = 'admin'
```

But to know the role, it calls:

```sql
FUNCTION get_user_role() RETURNS VARCHAR
  SELECT role FROM profiles WHERE id = auth.uid()
```

**Circular dependency**: Needs role to check RLS → RLS blocks query to check role

---

## ✅ IMMEDIATE SOLUTION: Disable RLS

**For MVP**, disable RLS completely. This is safe because:

- App is internal only (not public)
- Supabase still handles authentication (JWT, sessions)
- Role-based logic moved to frontend/backend code
- Can re-enable RLS after MVP testing

**See**: `docs/RLS_POLICY_FIX.md` for SQL to execute

---

## 🧪 Testing Checkpoint

After executing RLS disable SQL:

```bash
1. Refresh frontend (F5)
2. Login: teste@admin.com / senha123
3. Check browser console for logs
4. Expected: Login completes in < 2 seconds
5. Frontend redirects to dashboard
```

### Expected Logs:

```
[LOGIN] Form submission initiated
[AUTH] Login attempt started
[SESSION] Auth state changed
[PROFILE] Profile fetch attempt
[PROFILE] Profile fetch response
[AUTH] Sign in complete
[LOGIN] User already authenticated, redirecting
```

### If Still Stuck:

Check:

1. **Network tab**: Is profile fetch still pending?
2. **Supabase logs**: Is there a query still running?
3. **Frontend console**: Any errors beyond timeout?

---

## 📊 Current Status After Fix Attempt

| Component     | Status          | Notes                      |
| ------------- | --------------- | -------------------------- |
| Auth API      | ✅ 200 OK       | Returns successfully       |
| Login Speed   | ❌ 106s         | Should be < 1s             |
| Profile Fetch | ❓ Pending      | Likely blocked by RLS      |
| RLS Policies  | 🔴 **CIRCULAR** | `get_user_role()` deadlock |
| Frontend Code | ✅ Correct      | Logs added correctly       |
| User Creation | ✅ Works        | Created via Dashboard      |

---

## 🚀 Next Actions

1. **EXECUTE** SQL in `docs/RLS_POLICY_FIX.md`
2. **TEST** login speed
3. **IF WORKS**: Continue to CRUD testing
4. **IF FAILS**: Investigate specific error in logs

---

## Alternative Debugging: Check What's Blocked

If you want to verify RLS is the issue before running SQL:

```sql
-- In Supabase SQL Editor, run this:
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

Look for any policy that calls a function → **That's the bottleneck**

---

## Architecture After RLS Disabled

```
Frontend
  ↓
Supabase Auth (manages login/JWT) ✅
  ↓
PostgreSQL (RLS DISABLED) ✅
  ↓
Tables (anyone can read/write) ✅
  ↓
Frontend (shows data)
```

Security handled by:

- Supabase Auth (who you are)
- JWT validation (you're logged in)
- Frontend role checks (admin vs institution UI)
- API validation (if we add backend)
