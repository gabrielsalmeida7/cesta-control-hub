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
 * Schema base para família (sem refinamentos)
 */
const familySchemaBase = z.object({
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
  // Campos de composição familiar
  children_count: z.number()
    .int('Quantidade de filhos deve ser inteiro')
    .min(0, 'Quantidade de filhos não pode ser negativa')
    .max(20, 'Quantidade de filhos muito alta')
    .optional()
    .nullable(),
  children_ages: z.array(z.number().int().min(0).max(120))
    .optional()
    .nullable(),
  family_composition: z.number()
    .int('Composição familiar deve ser inteiro')
    .min(1, 'Deve ter pelo menos 1 pessoa na família')
    .max(50, 'Composição familiar muito alta')
    .optional()
    .nullable(),
  working_count: z.number()
    .int('Quantidade de pessoas que trabalham deve ser inteiro')
    .min(0, 'Quantidade não pode ser negativa')
    .max(50, 'Quantidade muito alta')
    .optional()
    .nullable(),
  formal_employment: z.boolean()
    .optional()
    .nullable(),
  family_income: z.enum([
    'Até 1 salário mínimo',
    '1 a 2 salários mínimos',
    '2 a 3 salários mínimos',
    '3 a 5 salários mínimos',
    'Acima de 5 salários mínimos',
    'Sem renda'
  ])
    .optional()
    .nullable(),
  family_composition_notes: z.string()
    .max(1000, 'Observações muito longas')
    .trim()
    .optional()
    .nullable(),
});

/**
 * Schema para criação de família (com refinamentos)
 */
export const familySchema = familySchemaBase.refine((data) => {
  // Validar que working_count não seja maior que family_composition
  if (data.working_count !== undefined && data.working_count !== null &&
      data.family_composition !== undefined && data.family_composition !== null) {
    return data.working_count <= data.family_composition;
  }
  return true;
}, {
  message: 'Quantidade de pessoas que trabalham não pode ser maior que a composição familiar',
  path: ['working_count'],
}).refine((data) => {
  // Validar que número de idades = número de filhos
  if (data.children_count !== undefined && data.children_count !== null &&
      data.children_ages !== undefined && data.children_ages !== null) {
    return data.children_ages.length === data.children_count;
  }
  return true;
}, {
  message: 'Número de idades deve ser igual ao número de filhos',
  path: ['children_ages'],
});

/**
 * Schema para atualização de família
 */
export const familyUpdateSchema = familySchemaBase.partial();

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

