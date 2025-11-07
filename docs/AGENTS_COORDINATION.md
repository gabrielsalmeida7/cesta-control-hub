# Multi-Agent Coordination Guide

## Overview

This document defines how 3 parallel agents coordinate development work without conflicts.

## Agent Assignment

### Agent 1: Institutions + Auth Fixes

- **Task File:** `docs/tasks/agent-1-institutions.md` ✅ COMPLETED
- **Task File:** `docs/tasks/agent-1-auth-fixes.md` 🔄 IN PROGRESS
- **Primary Files:** `src/pages/Institutions.tsx`, `src/hooks/useAuth.tsx`, `src/pages/Login.tsx`
- **Focus:** Replace mock data, connect CRUD operations, fix authentication flow and add logging

### Agent 2: Families

- **Task File:** `docs/tasks/agent-2-families.md` ✅ COMPLETED
- **Primary Files:** `src/pages/Families.tsx`, `src/components/FamilyInstitutionAssociation.tsx`
- **Focus:** Replace mock data, add family-institution association

### Agent 3: Deliveries

- **Task File:** `docs/tasks/agent-3-deliveries.md` ✅ COMPLETED
- **Primary Files:** `src/hooks/useDeliveries.ts`, `src/pages/DeliveryManagement.tsx`
- **Focus:** Create deliveries hook, replace mock data

## File Ownership

### Zero Overlap Design

Each agent works on completely different files to prevent conflicts:

- **Agent 1:** Only `src/pages/Institutions.tsx`
- **Agent 2:** Only `src/pages/Families.tsx` + new component
- **Agent 3:** Only `src/hooks/useDeliveries.ts` + `src/pages/DeliveryManagement.tsx`

### Shared Dependencies

All agents can safely use existing files:

- `src/hooks/useInstitutions.ts` (read-only)
- `src/hooks/useFamilies.ts` (read-only)
- `src/integrations/supabase/` (read-only)
- `src/components/ui/` (read-only)

## Lock System

### Task-Level Locking

Before starting any task:

1. Add `[LOCKED by Agent X at YYYY-MM-DD HH:MM]` to the task
2. Update task status to `IN_PROGRESS`
3. Remove lock when task completed

### Lock Format

```markdown
- [ ] **IN_PROGRESS** [LOCKED by Agent 1 at 2024-01-15 14:30] Replace mock data
```

### Wait Mechanism

If shared file needed (unlikely):

1. Check other task files for locks
2. Wait 30 seconds
3. Check again
4. Repeat until lock released

## Communication Protocol

### Real-Time Updates

Each agent must update their task file immediately:

- **TODO** → **IN_PROGRESS** (when starting)
- **IN_PROGRESS** → **DONE** (when completed)
- Add progress notes in summary section

### Progress Summary Updates

Each agent updates their task file with:

- Current status
- Start/completion times
- Any blockers encountered
- Notes for other agents

### Cross-Agent Communication

- Use task file comments for coordination
- Add notes about shared dependencies
- Report completion of shared resources

## Stop Conditions

### Individual Agent Stop

Agent stops when:

1. All assigned tasks marked as **DONE**
2. No TypeScript errors in modified files
3. No linter errors
4. Task file updated with final status
5. **DO NOT** run `npm run dev`, `npm start`, `npm install`

### Project Completion

All agents complete when:

1. All 3 task files show 100% completion
2. No compilation errors
3. All documentation updated

## Conflict Prevention

### File Separation

- Each agent owns specific files
- No shared file modifications
- Read-only access to common files

### Dependency Management

- All agents use existing hooks
- No modifications to shared components
- Follow established patterns

### Code Standards

- Follow `.cursorrules` strictly
- Use existing UI components
- Maintain TypeScript strict mode

## Error Handling

### TypeScript Errors

- Fix immediately when encountered
- Update task file with error details
- Do not proceed with broken code

### Linter Errors

- Fix all linting issues
- Follow project formatting rules
- Update task file with fixes applied

### Integration Issues

- Test integration with existing code
- Verify no breaking changes
- Update task file with test results

## Monitoring Progress

### Task File Status

Monitor completion via task files:

- Check `docs/tasks/agent-1-institutions.md`
- Check `docs/tasks/agent-2-families.md`
- Check `docs/tasks/agent-3-deliveries.md`

### Overall Progress

Track via task completion percentages:

- Agent 1: X/20 tasks complete
- Agent 2: X/24 tasks complete
- Agent 3: X/24 tasks complete

## Best Practices

### Code Quality

- Follow existing patterns
- Use TypeScript strictly
- Add proper error handling
- Include loading states

### Documentation

- Update task files in real-time
- Add progress notes
- Document any issues
- Reference other docs when needed

### Testing

- Verify functionality works
- Test error scenarios
- Ensure no regressions
- Update task file with test results

---

**Reference:** See individual task files for specific implementation details.
