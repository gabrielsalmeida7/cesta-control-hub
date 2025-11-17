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
    timeZone: 'America/Sao_Paulo', // UTC-3 (BRT - Brasília Time)
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // Formato 24 horas
  });
};

/**
 * Obtém a data atual em Brasília no formato ISO com hora do meio-dia
 * Isso garante que quando salvo no banco (TIMESTAMPTZ), será interpretado corretamente
 * @returns String no formato YYYY-MM-DDTHH:mm:ss-03:00 (com hora do meio-dia em Brasília)
 */
export const getCurrentDateBrasilia = (): string => {
  const now = new Date();
  
  // Obter componentes da data no timezone de Brasília
  const year = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric' });
  const month = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', month: '2-digit' });
  const day = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', day: '2-digit' });
  
  // Retornar no formato ISO com hora do meio-dia (12:00) em Brasília
  // Isso garante que quando convertido para UTC, ainda será o mesmo dia
  // 12:00 em Brasília (UTC-3) = 15:00 UTC, então não há risco de mudar de dia
  return `${year}-${month}-${day}T12:00:00-03:00`;
};

/**
 * Formata apenas a data com fuso horário de Brasília
 * @param dateString - String de data no formato ISO ou Date object
 * @returns String formatada no padrão DD/MM/YYYY
 */
export const formatDateBrasilia = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  
  let date: Date;
  
  if (typeof dateString === 'string') {
    // Se for apenas data (YYYY-MM-DD), criar data no meio-dia UTC para evitar problemas de timezone
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Data no formato YYYY-MM-DD - criar data no meio-dia UTC
      // Isso garante que quando convertida para Brasília, ainda será o mesmo dia
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) {
      // Data com hora ISO (pode ter Z, +00:00, -03:00, etc)
      // new Date() já trata corretamente todos esses formatos ISO
      date = new Date(dateString);
      
      // Se a data foi salva como meia-noite UTC (indicando que foi apenas data),
      // ajustar para meio-dia UTC para garantir que o dia seja exibido corretamente
      // Verificar se é meia-noite UTC (00:00:00Z ou similar)
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
      const utcSeconds = date.getUTCSeconds();
      
      // Se for exatamente meia-noite UTC (00:00:00), pode ser uma data antiga
      // Ajustar para meio-dia UTC para garantir que o dia seja o mesmo em Brasília
      if (utcHours === 0 && utcMinutes === 0 && utcSeconds === 0) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        date = new Date(Date.UTC(year, month, day, 12, 0, 0));
      }
    } else {
      // Outro formato - tentar criar normalmente
      date = new Date(dateString);
    }
  } else {
    date = dateString;
  }
  
  if (isNaN(date.getTime())) return 'Data inválida';
  
  // Formatar usando o timezone de Brasília
  // O toLocaleDateString com timeZone sempre converte corretamente,
  // independente de como a data foi salva (UTC, local, etc)
  return date.toLocaleDateString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

