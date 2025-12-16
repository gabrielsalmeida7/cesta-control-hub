/**
 * Schemas de validação Zod para formulários
 * Centraliza validações e garante consistência
 */

import { z } from 'zod';

/**
 * Validação de email
 */
export const emailSchema = z.string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório')
  .max(255, 'Email muito longo')
  .toLowerCase()
  .trim();

/**
 * Validação de senha forte
 */
export const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'A senha deve conter pelo menos um caractere especial');

/**
 * Validação de CPF (formato brasileiro)
 */
export const cpfSchema = z.string()
  .regex(/^\d{11}$/, 'CPF deve conter 11 dígitos')
  .refine((cpf) => {
    // Validação básica de CPF (algoritmo)
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    return digit === parseInt(cpf.charAt(10));
  }, 'CPF inválido')
  .optional()
  .nullable();

/**
 * Schema para criação de instituição
 */
export const institutionSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome muito longo')
    .trim(),
  address: z.string()
    .max(500, 'Endereço muito longo')
    .trim()
    .optional()
    .nullable(),
  phone: z.string()
    .max(20, 'Telefone muito longo')
    .regex(/^[\d\s()+-]+$/, 'Telefone inválido')
    .optional()
    .nullable(),
  email: emailSchema,
  password: passwordSchema,
  responsible_name: z.string()
    .min(1, 'Nome do responsável é obrigatório')
    .max(255, 'Nome muito longo')
    .trim(),
});

/**
 * Schema para atualização de instituição
 */
export const institutionUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome muito longo')
    .trim()
    .optional(),
  address: z.string()
    .max(500, 'Endereço muito longo')
    .trim()
    .optional()
    .nullable(),
  phone: z.string()
    .max(20, 'Telefone muito longo')
    .regex(/^[\d\s()+-]+$/, 'Telefone inválido')
    .optional()
    .nullable(),
  email: emailSchema.optional(),
  responsible_name: z.string()
    .min(1, 'Nome do responsável é obrigatório')
    .max(255, 'Nome muito longo')
    .trim()
    .optional(),
}).partial();

/**
 * Schema para criação de família
 */
export const familySchema = z.object({
  name: z.string()
    .min(1, 'Nome da família é obrigatório')
    .max(255, 'Nome muito longo')
    .trim(),
  contact_person: z.string()
    .min(1, 'Nome do contato é obrigatório')
    .max(255, 'Nome muito longo')
    .trim(),
  phone: z.string()
    .max(20, 'Telefone muito longo')
    .regex(/^[\d\s()+-]+$/, 'Telefone inválido')
    .optional()
    .nullable(),
  address: z.string()
    .max(500, 'Endereço muito longo')
    .trim()
    .optional()
    .nullable(),
  cpf: cpfSchema,
  members_count: z.number()
    .int('Número de membros deve ser inteiro')
    .min(1, 'Deve ter pelo menos 1 membro')
    .max(50, 'Número de membros muito alto'),
});

/**
 * Schema para atualização de família
 */
export const familyUpdateSchema = familySchema.partial();

/**
 * Schema para reset de senha
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

/**
 * Helper para limpar CPF (remover formatação)
 */
export const cleanCpf = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Helper para validar e limpar dados antes de enviar
 */
export const sanitizeInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

