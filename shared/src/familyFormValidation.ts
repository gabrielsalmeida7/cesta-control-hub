import { z } from 'zod';
import { familySchema, cleanCpf } from './validation';
import type { FamilyFormData } from './familyForm';

const step1Schema = z.object({
  name: z.string().min(1, 'Nome da família é obrigatório').trim(),
  contact_person: z.string().min(1, 'Nome do responsável é obrigatório').trim(),
  phone: z
    .string()
    .max(20, 'Telefone muito longo')
    .regex(/^[\d\s()+-]*$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  cpf: z.string().optional().or(z.literal('')),
  members_count: z.coerce.number().int().min(1, 'Deve ter pelo menos 1 membro').max(50),
  mother_name: z.string().max(255).optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  id_document: z.string().max(50).optional().or(z.literal('')),
  occupation: z.string().max(255).optional().or(z.literal('')),
  work_situation: z.string().max(255).optional().or(z.literal('')),
});

const step2Schema = z.object({
  address: z.string().max(500).optional().or(z.literal('')),
  address_reference: z.string().max(255).optional().or(z.literal('')),
  housing_type: z.string().max(100).optional().or(z.literal('')),
  construction_type: z.string().max(100).optional().or(z.literal('')),
  registered_in_other_institution: z.boolean(),
  other_institution_name: z.string().max(255).optional().or(z.literal('')),
});

const step3Schema = z
  .object({
    children_count: z.coerce.number().int().min(0).max(20),
    children_ages: z.array(z.coerce.number().int().min(0).max(120)),
    family_composition: z.coerce.number().int().min(1).max(50).nullable(),
    working_count: z.coerce.number().int().min(0).max(50),
    formal_employment: z.boolean(),
    family_income: z.string().nullable(),
    family_composition_notes: z.string().max(1000).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.working_count > 0 && data.family_composition !== null) {
        return data.working_count <= data.family_composition;
      }
      return true;
    },
    {
      message: 'Pessoas que trabalham não pode ser maior que a composição familiar',
      path: ['working_count'],
    }
  )
  .refine(
    (data) => data.children_ages.filter((age) => age > 0).length === data.children_count,
    { message: 'Informe a idade de cada filho', path: ['children_ages'] }
  );

export function validateFamilyWizardStep(step: number, data: FamilyFormData): string | null {
  try {
    switch (step) {
      case 0:
        step1Schema.parse({
          name: data.name,
          contact_person: data.contact_person,
          phone: data.phone,
          cpf: data.cpf,
          members_count: data.members_count,
          mother_name: data.mother_name,
          birth_date: data.birth_date,
          id_document: data.id_document,
          occupation: data.occupation,
          work_situation: data.work_situation,
        });
        if (data.cpf.trim()) {
          const digits = cleanCpf(data.cpf);
          if (digits.length !== 11) {
            return 'CPF deve conter 11 dígitos';
          }
        }
        return null;
      case 1:
        step2Schema.parse({
          address: data.address,
          address_reference: data.address_reference,
          housing_type: data.housing_type,
          construction_type: data.construction_type,
          registered_in_other_institution: data.registered_in_other_institution,
          other_institution_name: data.other_institution_name,
        });
        if (data.registered_in_other_institution && !data.other_institution_name.trim()) {
          return 'Informe o nome da outra instituição';
        }
        return null;
      case 2:
        step3Schema.parse({
          children_count: data.children_count,
          children_ages: data.children_ages,
          family_composition: data.family_composition,
          working_count: data.working_count,
          formal_employment: data.formal_employment,
          family_income: data.family_income,
          family_composition_notes: data.family_composition_notes,
        });
        return null;
      case 3:
        return null;
      case 4:
        return null;
      default: {
        const _exhaustive: never = step as never;
        return _exhaustive;
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? 'Dados inválidos';
    }
    return 'Dados inválidos';
  }
}

export function validateFamilyFormForSubmit(data: FamilyFormData): string | null {
  try {
    const cleanedCpf = data.cpf.trim() ? cleanCpf(data.cpf) : null;
    familySchema.parse({
      name: data.name.trim(),
      contact_person: data.contact_person.trim(),
      phone: data.phone.trim() || null,
      address: data.address.trim() || null,
      cpf: cleanedCpf,
      members_count: data.members_count,
      children_count: data.children_count,
      children_ages: data.children_ages.filter((age) => age > 0),
      family_composition: data.family_composition,
      working_count: data.working_count,
      formal_employment: data.formal_employment,
      family_income: data.family_income,
      family_composition_notes: data.family_composition_notes.trim() || null,
    });
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? 'Dados inválidos';
    }
    return 'Dados inválidos';
  }
}

export function buildFamilyInsertPayload(
  data: FamilyFormData,
  consent: { digital: boolean; termSigned: boolean; termId?: string }
) {
  const cleanedCpf = data.cpf.trim() ? cleanCpf(data.cpf) : null;
  const validAges = data.children_ages.filter((age) => age > 0);

  return {
    name: data.name.trim(),
    contact_person: data.contact_person.trim(),
    phone: data.phone.trim() || null,
    cpf: cleanedCpf,
    address: data.address.trim() || null,
    members_count: data.members_count,
    mother_name: data.mother_name.trim() || null,
    birth_date: data.birth_date.trim() || null,
    id_document: data.id_document.trim() || null,
    occupation: data.occupation.trim() || null,
    work_situation: data.work_situation.trim() || null,
    children_count: data.children_count,
    children_ages: validAges.length > 0 ? validAges : null,
    family_composition: data.family_composition,
    working_count: data.working_count,
    formal_employment: data.formal_employment,
    family_income: data.family_income,
    family_composition_notes: data.family_composition_notes.trim() || null,
    address_reference: data.address_reference.trim() || null,
    registered_in_other_institution: data.registered_in_other_institution,
    other_institution_name: data.other_institution_name.trim() || null,
    receives_government_aid: data.receives_government_aid,
    receives_bolsa_familia: data.receives_bolsa_familia,
    receives_auxilio_gas: data.receives_auxilio_gas,
    receives_bpc: data.receives_bpc,
    receives_loas: data.receives_loas,
    receives_other_aid: data.receives_other_aid,
    other_aid_description: data.other_aid_description.trim() || null,
    has_chronic_disease: data.has_chronic_disease,
    chronic_disease_description: data.chronic_disease_description.trim() || null,
    housing_type: data.housing_type.trim() || null,
    construction_type: data.construction_type.trim() || null,
    has_water_supply: data.has_water_supply,
    has_electricity: data.has_electricity,
    has_garbage_collection: data.has_garbage_collection,
    food_insecurity: data.food_insecurity,
    unemployment: data.unemployment,
    poor_health: data.poor_health,
    substance_abuse: data.substance_abuse,
    other_vulnerabilities: data.other_vulnerabilities.trim() || null,
    consent_given_at: consent.digital ? new Date().toISOString() : null,
    consent_term_signed: consent.termSigned,
    consent_term_id: consent.termId ?? null,
    consent_term_generated_at: consent.termId ? new Date().toISOString() : null,
  };
}
