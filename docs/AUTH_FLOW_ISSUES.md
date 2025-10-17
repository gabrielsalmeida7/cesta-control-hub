# Auth Flow Issues Analysis

## Problemas Identificados

### 1. Logout Não Remove Sessão Real (CRÍTICO)

**Atual:**

```typescript
const signOut = async () => {
  localStorage.removeItem("bypass_user");
  const { error } = await supabase.auth.signOut();
  // Reset states
  setUser(null);
  setSession(null);
  setProfile(null);
};
```

**Problema:**

- `supabase.auth.signOut()` limpa no servidor
- MAS o localStorage pode ter cookies de sessão que persistem
- F5 recarrega a sessão do cookie
- Bypass_user é removido, mas real auth persiste

**Solução:**

- Limpar também `supabase.auth.clearSession()` ou similar
- Remover tokens do localStorage do Supabase

---

### 2. Bypass Mode Não É Visual

**Atual:**

- Bypass buttons sem estado visual de "pressionado"
- Não diferencia entre bypass e real auth
- F5 depois de bypass mantém a sessão visualmente

**Problema:**

- Não há forma de saber qual modo está ativo
- Usuário pensa que fez login real quando é só bypass
- Estados visuais confusos

**Solução:**

- Adicionar `isBypassMode` state
- Mostrar visualmente qual botão está ativo
- Diferenciar no header entre bypass e real auth

---

### 3. Persistência de Sessão Mesmo Após Logout

**Fluxo Problematório:**

```
1. User faz login real → Supabase cria session + cookie
2. User faz logout → localStorage.removeItem('bypass_user')
3. User faz F5 → onAuthStateChange dispara
4. Session ainda existe no cookie
5. Auto-loga novamente
```

**Problema:**

- `onAuthStateChange` listener reinicia automaticamente
- Session no localStorage do Supabase não é limpa
- Logout = só remove bypass_user, mas não a session real

---

## Flow Correto Necessário

```
REAL LOGIN:
user clicks "Fazer Login"
  → signIn()
  → supabase.auth.signInWithPassword()
  → onAuthStateChange dispara
  → profile é fetchado
  → user é autenticado
  → redireciona para /

BYPASS LOGIN (TESTE):
user clicks "Entrar como Admin"
  → bypass_user é setado em localStorage
  → isBypassMode = true (novo state)
  → redireciona para /
  → visual mostra que é BYPASS

REAL LOGOUT:
user clicks "Sair"
  → supabase.auth.signOut()
  → Limpar localStorage: bypass_user AND supabase session tokens
  → setUser(null), setSession(null), setProfile(null)
  → isBypassMode = false
  → redireciona para /login
  → F5 não auto-loga

BYPASS LOGOUT:
user clicks "Sair"
  → localStorage.removeItem('bypass_user')
  → setUser(null), setSession(null), setProfile(null)
  → isBypassMode = false
  → redireciona para /login
```

---

## Implementação Necessária

### 1. Adicionar `isBypassMode` State

```typescript
const [isBypassMode, setIsBypassMode] = useState(false);
```

### 2. Diferenciar Bypass de Real Auth

```typescript
// Bypass
localStorage.setItem('bypass_user', ...);
setIsBypassMode(true);

// Real Auth
supabase.auth.signInWithPassword(...);
setIsBypassMode(false);
```

### 3. Limpar Corretamente no Logout

```typescript
const signOut = async () => {
  // Limpar bypass
  localStorage.removeItem("bypass_user");

  // Limpar session real
  await supabase.auth.signOut();

  // Limpar tokens do Supabase do localStorage
  localStorage.removeItem("sb-eslfcjhnaojghzuswpgz-auth-token");

  // Resetar tudo
  setUser(null);
  setSession(null);
  setProfile(null);
  setIsBypassMode(false);
};
```

### 4. Login Page - Botões com Estado Visual

```tsx
<Button
  onClick={handleBypassAdmin}
  variant={isBypassMode && profile?.role === "admin" ? "default" : "outline"}
  className={isBypassMode && profile?.role === "admin" ? "bg-green-500" : ""}
>
  {isBypassMode && profile?.role === "admin"
    ? "✓ Admin (Ativo)"
    : "🔧 Entrar como Admin"}
</Button>
```

### 5. Header - Mostrar Modo Vigente

```tsx
{
  isBypassMode && <Badge variant="destructive">⚠️ BYPASS MODE (Teste)</Badge>;
}
```

---

## Checklist de Correções

- [ ] Adicionar `isBypassMode` state
- [ ] Diferenciar bypass de real auth no useAuth
- [ ] Limpar tokens do localStorage no logout
- [ ] Mostrar estado visual dos bypass buttons
- [ ] Mostrar aviso de bypass no header
- [ ] Testar logout + F5
- [ ] Testar real login + logout + F5
- [ ] Testar bypass + logout + F5
