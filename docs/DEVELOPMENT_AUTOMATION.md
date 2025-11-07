# Development Automation Guide

## Overview

This guide covers what can be automated vs. what requires manual interface interaction during MVP development.

## What Requires Interface (Manual Actions)

### 1. **Code Development**

- **VS Code/Cursor** - Edit source files
- **Browser DevTools** - Debug and test UI
- **Terminal** - Run specific commands (see below)

### 2. **Supabase Configuration**

- **Supabase Dashboard** - Configure RLS policies
- **SQL Editor** - Execute database setup scripts
- **Auth Settings** - Configure authentication rules

### 3. **Deploy & Hosting**

- **Vercel/Netlify Dashboard** - Deploy application
- **Domain Configuration** - Setup custom domains
- **Environment Variables** - Configure production settings

## What's Automatable (Terminal/Scripts)

### 1. **Project Setup**

```bash
# Already done - no need to run
npm install
npm run dev
```

### 2. **Supabase CLI**

```bash
# Generate types after schema changes
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# Database operations
supabase db reset
supabase db seed
```

### 3. **Development Commands**

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

### 4. **Git Operations**

```bash
# Standard git workflow
git add .
git commit -m "message"
git push
```

## Developer Actions Needed

### Critical (Must Do Manually)

1. **Configure Supabase Dashboard**

   - Enable RLS on all tables
   - Create RLS policies for admin/institution roles
   - Configure auth settings

2. **Edit Code**

   - Replace mock data with Supabase hooks
   - Implement form validations
   - Add loading/error states

3. **Test in Browser**
   - Verify UI functionality
   - Test authentication flows
   - Validate business rules

### Optional (Can Be Automated)

- Type generation (Supabase CLI)
- Linting/formatting
- Build processes

## Quick Reference

### Essential Commands

```bash
# Generate types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# Type check
npm run type-check

# Build
npm run build
```

### Commands to AVOID

- `npm run dev` (assume already running)
- `npm install` (assume already done)
- `npm start` (not needed for development)

## Time Estimates

| Task                 | Interface Required | Time       |
| -------------------- | ------------------ | ---------- |
| **Supabase Setup**   | Dashboard          | 2-3 hours  |
| **Code Integration** | VS Code            | 8-12 hours |
| **Testing**          | Browser            | 2-4 hours  |
| **Deploy**           | Dashboard          | 1-2 hours  |

## Next Steps

1. Configure Supabase Dashboard (RLS policies)
2. Implement code changes (follow task files)
3. Test in browser
4. Deploy to production

---

**Reference:** See `docs/FRONTEND_TASKS.md` for detailed implementation tasks.
