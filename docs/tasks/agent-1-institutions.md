# Agent 1: Institutions Integration

## Overview

Replace mock data in Institutions page with real Supabase integration.

## Files to Modify

- `src/pages/Institutions.tsx`

## Tasks

### 1. Replace Mock Data

- [x] **DONE** Remove array `institutions` mock (lines 53-122)
- [x] **DONE** Import and use hook `useInstitutions`
- [x] **DONE** Add loading state with `isLoading`
- [x] **DONE** Add error state with `error`

### 2. Connect Create Form

- [x] **DONE** Implement "Nova Instituição" button (line 166)
- [x] **DONE** Create dialog with form using `useCreateInstitution`
- [x] **DONE** Add form validation with react-hook-form
- [x] **DONE** Show success/error toasts

### 3. Connect Edit Form

- [x] **DONE** Use `useUpdateInstitution` in `onSubmit` (line 140)
- [x] **DONE** Remove local state update logic
- [x] **DONE** Add loading state to submit button
- [x] **DONE** Handle form errors properly

### 4. Implement Delete

- [x] **DONE** Add "Excluir" button to institution cards
- [x] **DONE** Create confirmation dialog
- [x] **DONE** Use `useDeleteInstitution` hook
- [x] **DONE** Add loading state to delete button

### 5. Add Loading/Error States

- [x] **DONE** Add skeleton loading for institution list
- [x] **DONE** Add error boundary for failed requests
- [x] **DONE** Add retry mechanism for failed requests
- [x] **DONE** Add empty state when no institutions

## Dependencies

- None (can start immediately)
- Uses existing hooks: `useInstitutions`, `useCreateInstitution`, `useUpdateInstitution`, `useDeleteInstitution`

## Stop Criteria

- [x] All tasks marked as DONE
- [x] No TypeScript errors in `src/pages/Institutions.tsx`
- [x] No linter errors
- [x] Task file updated with final status

## Progress Summary

**Status:** DONE  
**Started:** 2025-01-27 14:30  
**Completed:** 2025-01-27 14:45  
**Blockers:** None

## Lock System

- Add `[LOCKED by Agent 1 at YYYY-MM-DD HH:MM]` before starting task
- Remove lock when task completed
- Check for locks in other task files if shared files needed

## Notes

- Follow existing patterns in `src/pages/Families.tsx` for reference
- Use shadcn/ui components for dialogs and forms
- Reference `docs/FRONTEND_TASKS.md` for detailed implementation
