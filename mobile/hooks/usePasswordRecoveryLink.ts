import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { createSessionFromAuthUrl, isPasswordRecoveryUrl } from '@/utils/authDeepLink';
import { logger } from '@/utils/logger';

export function usePasswordRecoveryLink(): void {
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!isPasswordRecoveryUrl(url)) {
        return;
      }

      try {
        await createSessionFromAuthUrl(url);
        router.replace('/(auth)/reset-password');
      } catch (error) {
        logger.error('Falha ao processar link de recuperação de senha', {
          error: error instanceof Error ? error.message : String(error),
        });
        router.replace('/(auth)/login');
      }
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          void handleUrl(url);
        }
      })
      .catch(() => undefined);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => subscription.remove();
  }, []);
}
