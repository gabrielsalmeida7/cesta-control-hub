import { formatDateBrasilia } from './dateFormat';

export interface FamilyBlockStatusInput {
  is_blocked?: boolean | null;
  blocked_until?: string | null;
  block_reason?: string | null;
  blocked_by_institution?: { name?: string } | null;
}

export interface FamilyBlockStatus {
  isBlocked: boolean;
  daysRemaining: number;
  blockedUntilFormatted: string | null;
  blockReason: string | null;
  blockedByInstitutionName: string | null;
}

export function getFamilyBlockStatus(family: FamilyBlockStatusInput): FamilyBlockStatus {
  const blockReason = family.block_reason ?? null;
  const blockedByInstitutionName = family.blocked_by_institution?.name ?? null;

  if (!family.is_blocked || !family.blocked_until) {
    return {
      isBlocked: false,
      daysRemaining: 0,
      blockedUntilFormatted: null,
      blockReason,
      blockedByInstitutionName,
    };
  }

  const blockedUntil = new Date(family.blocked_until);
  if (blockedUntil <= new Date()) {
    return {
      isBlocked: false,
      daysRemaining: 0,
      blockedUntilFormatted: null,
      blockReason,
      blockedByInstitutionName,
    };
  }

  const daysRemaining = Math.ceil(
    (blockedUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return {
    isBlocked: true,
    daysRemaining,
    blockedUntilFormatted: formatDateBrasilia(family.blocked_until),
    blockReason,
    blockedByInstitutionName,
  };
}
