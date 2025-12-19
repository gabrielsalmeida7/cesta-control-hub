/**
 * Utilitários para detecção de ambiente
 * 
 * Detecta se o sistema está rodando em desenvolvimento ou produção
 * baseado na URL/hostname do navegador
 */

/**
 * Verifica se o sistema está rodando em ambiente de desenvolvimento
 * 
 * @returns true se estiver em desenvolvimento, false se estiver em produção
 */
export const isDevelopment = (): boolean => {
  // Se não estiver no navegador (SSR), retorna false (assume produção)
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();

  // Verifica se é localhost ou IP local
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' || // IPv6 localhost
    hostname.startsWith('192.168.') || // Rede local privada
    hostname.startsWith('10.') || // Rede local privada
    hostname.startsWith('172.16.') || // Rede local privada (172.16.0.0 - 172.31.255.255)
    hostname.startsWith('172.17.') ||
    hostname.startsWith('172.18.') ||
    hostname.startsWith('172.19.') ||
    hostname.startsWith('172.20.') ||
    hostname.startsWith('172.21.') ||
    hostname.startsWith('172.22.') ||
    hostname.startsWith('172.23.') ||
    hostname.startsWith('172.24.') ||
    hostname.startsWith('172.25.') ||
    hostname.startsWith('172.26.') ||
    hostname.startsWith('172.27.') ||
    hostname.startsWith('172.28.') ||
    hostname.startsWith('172.29.') ||
    hostname.startsWith('172.30.') ||
    hostname.startsWith('172.31.') ||
    hostname.endsWith('.local') || // Domínios .local
    hostname.endsWith('.test') || // Domínios .test
    hostname.includes('localhost') // Qualquer variação de localhost
  );
};

/**
 * Verifica se o sistema está rodando em ambiente de produção
 * 
 * @returns true se estiver em produção, false se estiver em desenvolvimento
 */
export const isProduction = (): boolean => {
  return !isDevelopment();
};

/**
 * ID da instituição de desenvolvimento que deve ser ocultada em produção
 */
export const DEV_INSTITUTION_ID = 'eaaab164-b376-4c97-866b-a80d811e4d0d';

