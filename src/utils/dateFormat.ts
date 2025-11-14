/**
 * Formata data/hora com fuso horário de Brasília
 * @param dateString - String de data no formato ISO ou Date object
 * @returns String formatada no padrão DD/MM/YYYY HH:mm
 */
export const formatDateTimeBrasilia = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'Nunca';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return 'Data inválida';
  
  return date.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formata apenas a data com fuso horário de Brasília
 * @param dateString - String de data no formato ISO ou Date object
 * @returns String formatada no padrão DD/MM/YYYY
 */
export const formatDateBrasilia = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return 'Data inválida';
  
  return date.toLocaleDateString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

