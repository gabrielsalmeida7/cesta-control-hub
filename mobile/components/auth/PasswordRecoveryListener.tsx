import { usePasswordRecoveryLink } from '@/hooks/usePasswordRecoveryLink';

export function PasswordRecoveryListener() {
  usePasswordRecoveryLink();
  return null;
}
