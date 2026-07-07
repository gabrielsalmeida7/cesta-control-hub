export const FAMILY_INCOME_OPTIONS = [
  'Até 1 salário mínimo',
  '1 a 2 salários mínimos',
  '2 a 3 salários mínimos',
  '3 a 5 salários mínimos',
  'Acima de 5 salários mínimos',
  'Sem renda',
] as const;

export type FamilyIncome = (typeof FAMILY_INCOME_OPTIONS)[number];

export interface FamilyFormData {
  name: string;
  contact_person: string;
  phone: string;
  cpf: string;
  address: string;
  members_count: number;
  mother_name: string;
  birth_date: string;
  id_document: string;
  occupation: string;
  work_situation: string;
  children_count: number;
  children_ages: number[];
  family_composition: number | null;
  working_count: number;
  formal_employment: boolean;
  family_income: FamilyIncome | null;
  family_composition_notes: string;
  address_reference: string;
  registered_in_other_institution: boolean;
  other_institution_name: string;
  receives_government_aid: boolean;
  receives_bolsa_familia: boolean;
  receives_auxilio_gas: boolean;
  receives_bpc: boolean;
  receives_loas: boolean;
  receives_other_aid: boolean;
  other_aid_description: string;
  has_chronic_disease: boolean;
  chronic_disease_description: string;
  housing_type: string;
  construction_type: string;
  has_water_supply: boolean;
  has_electricity: boolean;
  has_garbage_collection: boolean;
  food_insecurity: boolean;
  unemployment: boolean;
  poor_health: boolean;
  substance_abuse: boolean;
  other_vulnerabilities: string;
}

export const DEFAULT_FAMILY_FORM: FamilyFormData = {
  name: '',
  contact_person: '',
  phone: '',
  cpf: '',
  address: '',
  members_count: 1,
  mother_name: '',
  birth_date: '',
  id_document: '',
  occupation: '',
  work_situation: '',
  children_count: 0,
  children_ages: [],
  family_composition: null,
  working_count: 0,
  formal_employment: false,
  family_income: null,
  family_composition_notes: '',
  address_reference: '',
  registered_in_other_institution: false,
  other_institution_name: '',
  receives_government_aid: false,
  receives_bolsa_familia: false,
  receives_auxilio_gas: false,
  receives_bpc: false,
  receives_loas: false,
  receives_other_aid: false,
  other_aid_description: '',
  has_chronic_disease: false,
  chronic_disease_description: '',
  housing_type: '',
  construction_type: '',
  has_water_supply: false,
  has_electricity: false,
  has_garbage_collection: false,
  food_insecurity: false,
  unemployment: false,
  poor_health: false,
  substance_abuse: false,
  other_vulnerabilities: '',
};

export const FAMILY_WIZARD_STEPS = [
  'Dados pessoais',
  'Endereço',
  'Composição e renda',
  'Vulnerabilidades',
  'LGPD',
] as const;
