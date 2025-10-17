# Agent 2: Families Integration

## Overview

Replace mock data in Families page with real Supabase integration and add family-institution association.

## Files to Modify

- `src/pages/Families.tsx`
- `src/components/FamilyInstitutionAssociation.tsx` (create new)

## Tasks

### 1. Replace Mock Data

- [x] **DONE** Remove array `families` mock (lines 40-98)
- [x] **DONE** Import and use hook `useFamilies`
- [x] **DONE** Add loading state with `isLoading`
- [x] **DONE** Add error state with `error`

### 2. Connect Create Form

- [x] **DONE** Implement "Nova Família" button (line 156)
- [x] **DONE** Create dialog with form using `useCreateFamily`
- [x] **DONE** Add form validation with react-hook-form
- [x] **DONE** Show success/error toasts

### 3. Connect Edit Form

- [x] **DONE** Implement "Editar" button (line 196)
- [x] **DONE** Create dialog with form using `useUpdateFamily`
- [x] **DONE** Add form validation
- [x] **DONE** Handle form errors properly

### 4. Implement Unblock

- [x] **DONE** Connect "Desbloquear" button (line 208)
- [x] **DONE** Use `useUpdateFamily` to set `is_blocked: false`
- [x] **DONE** Add confirmation dialog
- [x] **DONE** Add loading state to unblock button

### 5. Create Association Component

- [x] **DONE** Create `src/components/FamilyInstitutionAssociation.tsx`
- [x] **DONE** Add interface to link family to institution
- [x] **DONE** List available institutions for selection
- [x] **DONE** Use `useInstitutionFamilies` hook
- [x] **DONE** Add "Vincular Instituição" button to family cards

### 6. Add Loading/Error States

- [x] **DONE** Add skeleton loading for family list
- [x] **DONE** Add error boundary for failed requests
- [x] **DONE** Add retry mechanism for failed requests
- [x] **DONE** Add empty state when no families

## Dependencies

- None (can start immediately)
- Uses existing hooks: `useFamilies`, `useCreateFamily`, `useUpdateFamily`, `useInstitutionFamilies`

## Stop Criteria

- [x] All tasks marked as DONE
- [x] No TypeScript errors in modified files
- [x] No linter errors
- [x] Task file updated with final status

## Progress Summary

**Status:** DONE  
**Started:** 2025-01-27 14:30  
**Completed:** 2025-01-27 15:00  
**Blockers:** None

## Lock System

- Add `[LOCKED by Agent 2 at YYYY-MM-DD HH:MM]` before starting task
- Remove lock when task completed
- Check for locks in other task files if shared files needed

## Notes

- Follow existing patterns in `src/pages/Institutions.tsx` for reference
- Use shadcn/ui components for dialogs and forms
- Reference `docs/FRONTEND_TASKS.md` for detailed implementation
- New component should be reusable and follow project patterns
