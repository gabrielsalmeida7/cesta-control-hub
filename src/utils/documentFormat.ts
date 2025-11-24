/**
 * Utilitários para formatação e validação de documentos (CPF/CNPJ)
 */

/**
 * Remove caracteres não numéricos de uma string
 */
const removeNonNumeric = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Formata CPF no padrão XXX.XXX.XXX-XX
 */
export const formatCpf = (cpf: string | null | undefined): string => {
  if (!cpf) return "";
  
  const numbers = removeNonNumeric(cpf);
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

/**
 * Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX
 */
export const formatCnpj = (cnpj: string | null | undefined): string => {
  if (!cnpj) return "";
  
  const numbers = removeNonNumeric(cnpj);
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
};

/**
 * Valida CPF (verifica dígitos verificadores)
 */
export const validateCpf = (cpf: string | null | undefined): boolean => {
  if (!cpf) return false;
  
  const numbers = removeNonNumeric(cpf);
  
  if (numbers.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) return false;
  
  return true;
};

/**
 * Valida CNPJ (verifica dígitos verificadores)
 */
export const validateCnpj = (cnpj: string | null | undefined): boolean => {
  if (!cnpj) return false;
  
  const numbers = removeNonNumeric(cnpj);
  
  if (numbers.length !== 14) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validar primeiro dígito verificador
  let length = numbers.length - 2;
  let sequence = numbers.substring(0, length);
  let digits = numbers.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(sequence.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Validar segundo dígito verificador
  length = length + 1;
  sequence = numbers.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(sequence.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

/**
 * Formata documento (CPF ou CNPJ) baseado no tipo
 */
export const formatDocument = (
  document: string | null | undefined,
  type: "PF" | "PJ"
): string => {
  if (!document) return "";
  
  if (type === "PF") {
    return formatCpf(document);
  } else {
    return formatCnpj(document);
  }
};

/**
 * Valida documento (CPF ou CNPJ) baseado no tipo
 */
export const validateDocument = (
  document: string | null | undefined,
  type: "PF" | "PJ"
): boolean => {
  if (!document) return false;
  
  if (type === "PF") {
    return validateCpf(document);
  } else {
    return validateCnpj(document);
  }
};

