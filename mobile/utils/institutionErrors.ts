type EdgeFunctionResponse = {
  success?: boolean;
  error?: string;
  user_id?: string;
  email?: string;
};

export function parseCreateInstitutionUserError(
  functionError: { message?: string } | null,
  functionResponse: EdgeFunctionResponse | null
): string {
  if (functionResponse?.error) {
    return mapFriendlyInstitutionError(functionResponse.error);
  }

  const message = functionError?.message ?? '';
  if (!message) {
    return 'Erro ao criar usuário da instituição. A instituição foi removida automaticamente.';
  }

  try {
    const jsonStart = message.indexOf('{');
    if (jsonStart >= 0) {
      const parsed = JSON.parse(message.slice(jsonStart)) as { error?: string };
      if (parsed.error) {
        return mapFriendlyInstitutionError(parsed.error);
      }
    }
  } catch {
    // ignore JSON parse errors
  }

  return mapFriendlyInstitutionError(message);
}

function mapFriendlyInstitutionError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Este email já está cadastrado no sistema. Use outro email.';
  }
  if (lower.includes('forbidden') || lower.includes('admin access required')) {
    return 'Acesso negado. Apenas administradores podem criar instituições.';
  }
  if (lower.includes('service role key not configured')) {
    return 'Configuração do servidor incompleta. Contate o suporte técnico.';
  }
  if (lower.includes('missing authorization') || lower.includes('unauthorized')) {
    return 'Sessão expirada. Faça login novamente.';
  }
  if (lower.includes('password')) {
    return 'Senha inválida. Use pelo menos 8 caracteres com letras, números e símbolos.';
  }
  if (lower.includes('duplicate') || lower.includes('já está cadastrado') || lower.includes('já está em uso')) {
    return message;
  }

  return message;
}
