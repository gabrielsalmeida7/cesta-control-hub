import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { ConsentManagement } from '@/components/domain/ConsentManagement';
import { useCreateFamily } from '@/hooks/useFamilies';
import { useFamilyWizardForm } from '@/hooks/useFamilyWizardForm';
import { supabase } from '@/integrations/supabase/client';
import { formatCpf } from '@/utils/documentFormat';
import {
  FAMILY_INCOME_OPTIONS,
  FAMILY_WIZARD_STEPS,
} from '@/types/familyForm';
import {
  buildFamilyInsertPayload,
  validateFamilyFormForSubmit,
  validateFamilyWizardStep,
} from '@/utils/familyFormValidation';
import { cleanCpf } from '@/utils/validation';

interface FamilyWizardProps {
  institutionId?: string;
  institutionName?: string;
  mode?: 'institution' | 'admin';
  initialCpf?: string;
  onComplete: () => void;
  onCancel: () => void;
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-center gap-3 rounded-lg border border-border p-3"
    >
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <Text className="flex-1 text-sm text-foreground">{label}</Text>
    </Pressable>
  );
}

export function FamilyWizard({
  institutionId,
  institutionName = 'Sistema',
  mode = institutionId ? 'institution' : 'admin',
  initialCpf,
  onComplete,
  onCancel,
}: FamilyWizardProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const { form, updateForm, syncChildrenAges } = useFamilyWizardForm(initialCpf);
  const [consentGiven, setConsentGiven] = useState(false);
  const [termSigned, setTermSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFamily = useCreateFamily();

  const goNext = () => {
    const validationError = validateFamilyWizardStep(step, form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, FAMILY_WIZARD_STEPS.length - 1) as 0 | 1 | 2 | 3 | 4);
  };

  const goBack = () => {
    setError(null);
    if (step === 0) {
      onCancel();
      return;
    }
    setStep((s) => (s - 1) as 0 | 1 | 2 | 3 | 4);
  };

  const checkDuplicates = async (): Promise<string | null> => {
    const cleanedCpf = form.cpf.trim() ? cleanCpf(form.cpf) : null;
    if (cleanedCpf && cleanedCpf.length === 11) {
      const { data } = await supabase
        .from('families')
        .select('id, name')
        .eq('cpf', cleanedCpf)
        .limit(1);
      if (data && data.length > 0) {
        return `CPF já cadastrado para a família ${data[0].name}.`;
      }
    }

    const motherName = form.mother_name.trim();
    if (motherName) {
      const { data } = await supabase
        .from('families')
        .select('id, name')
        .ilike('mother_name', motherName)
        .limit(1);
      if (data && data.length > 0) {
        return `Nome da mãe já cadastrado para a família ${data[0].name}.`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    if (!consentGiven) {
      setError('É necessário aceitar o consentimento LGPD para cadastrar.');
      return;
    }

    const validationError = validateFamilyFormForSubmit(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const duplicateError = await checkDuplicates();
    if (duplicateError) {
      setError(duplicateError);
      return;
    }

    setError(null);

    try {
      const payload = buildFamilyInsertPayload(form, {
        digital: consentGiven,
        termSigned,
      });

      await createFamily.mutateAsync({
        family: payload,
        institutionId: mode === 'institution' ? institutionId : undefined,
      });

      onComplete();
    } catch {
      // toast handled by hook
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View className="gap-3">
            <View className="gap-2">
              <Label>Nome da família *</Label>
              <Input
                value={form.name}
                onChangeText={(v) => updateForm('name', v)}
                placeholder="Ex: Família Silva"
              />
            </View>
            <View className="gap-2">
              <Label>Responsável (titular) *</Label>
              <Input
                value={form.contact_person}
                onChangeText={(v) => updateForm('contact_person', v)}
                placeholder="Ex: João Silva"
              />
            </View>
            <View className="gap-2">
              <Label>CPF do titular</Label>
              <Input
                value={form.cpf}
                onChangeText={(v) => updateForm('cpf', formatCpf(v))}
                placeholder="000.000.000-00"
                keyboardType="numeric"
                maxLength={14}
              />
            </View>
            <View className="gap-2">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChangeText={(v) => updateForm('phone', v)}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />
            </View>
            <View className="gap-2">
              <Label>Nome da mãe</Label>
              <Input
                value={form.mother_name}
                onChangeText={(v) => updateForm('mother_name', v)}
                placeholder="Nome completo da mãe"
              />
            </View>
            <View className="gap-2">
              <Label>Data de nascimento</Label>
              <Input
                value={form.birth_date}
                onChangeText={(v) => updateForm('birth_date', v)}
                placeholder="AAAA-MM-DD"
              />
            </View>
            <View className="gap-2">
              <Label>Documento de identidade</Label>
              <Input
                value={form.id_document}
                onChangeText={(v) => updateForm('id_document', v)}
              />
            </View>
            <View className="gap-2">
              <Label>Ocupação</Label>
              <Input value={form.occupation} onChangeText={(v) => updateForm('occupation', v)} />
            </View>
            <View className="gap-2">
              <Label>Situação de trabalho</Label>
              <Input
                value={form.work_situation}
                onChangeText={(v) => updateForm('work_situation', v)}
              />
            </View>
            <View className="gap-2">
              <Label>Nº de membros *</Label>
              <Input
                value={String(form.members_count)}
                onChangeText={(v) => updateForm('members_count', parseInt(v, 10) || 1)}
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View className="gap-3">
            <View className="gap-2">
              <Label>Endereço</Label>
              <Textarea
                value={form.address}
                onChangeText={(v) => updateForm('address', v)}
                placeholder="Rua, número, bairro, cidade"
              />
            </View>
            <View className="gap-2">
              <Label>Ponto de referência</Label>
              <Input
                value={form.address_reference}
                onChangeText={(v) => updateForm('address_reference', v)}
              />
            </View>
            <View className="gap-2">
              <Label>Tipo de moradia</Label>
              <Input
                value={form.housing_type}
                onChangeText={(v) => updateForm('housing_type', v)}
                placeholder="Ex: Alugada, própria, cedida"
              />
            </View>
            <View className="gap-2">
              <Label>Tipo de construção</Label>
              <Input
                value={form.construction_type}
                onChangeText={(v) => updateForm('construction_type', v)}
                placeholder="Ex: Alvenaria, madeira"
              />
            </View>
            <BooleanField
              label="Abastecimento de água"
              checked={form.has_water_supply}
              onChange={(v) => updateForm('has_water_supply', v)}
            />
            <BooleanField
              label="Energia elétrica"
              checked={form.has_electricity}
              onChange={(v) => updateForm('has_electricity', v)}
            />
            <BooleanField
              label="Coleta de lixo"
              checked={form.has_garbage_collection}
              onChange={(v) => updateForm('has_garbage_collection', v)}
            />
            <BooleanField
              label="Cadastrada em outra instituição"
              checked={form.registered_in_other_institution}
              onChange={(v) => updateForm('registered_in_other_institution', v)}
            />
            {form.registered_in_other_institution ? (
              <View className="gap-2">
                <Label>Nome da outra instituição</Label>
                <Input
                  value={form.other_institution_name}
                  onChangeText={(v) => updateForm('other_institution_name', v)}
                />
              </View>
            ) : null}
          </View>
        );

      case 2:
        return (
          <View className="gap-3">
            <View className="gap-2">
              <Label>Quantidade de filhos</Label>
              <Input
                value={String(form.children_count)}
                onChangeText={(v) => syncChildrenAges(parseInt(v, 10) || 0)}
                keyboardType="numeric"
              />
            </View>
            {form.children_count > 0
              ? form.children_ages.map((age, index) => (
                  <View key={index} className="gap-2">
                    <Label>Idade do filho {index + 1}</Label>
                    <Input
                      value={age > 0 ? String(age) : ''}
                      onChangeText={(v) => {
                        const ages = [...form.children_ages];
                        ages[index] = parseInt(v, 10) || 0;
                        updateForm('children_ages', ages);
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                ))
              : null}
            <View className="gap-2">
              <Label>Composição familiar (total)</Label>
              <Input
                value={form.family_composition !== null ? String(form.family_composition) : ''}
                onChangeText={(v) =>
                  updateForm('family_composition', v ? parseInt(v, 10) : null)
                }
                keyboardType="numeric"
              />
            </View>
            <View className="gap-2">
              <Label>Pessoas que trabalham</Label>
              <Input
                value={String(form.working_count)}
                onChangeText={(v) => updateForm('working_count', parseInt(v, 10) || 0)}
                keyboardType="numeric"
              />
            </View>
            <BooleanField
              label="Emprego formal"
              checked={form.formal_employment}
              onChange={(v) => updateForm('formal_employment', v)}
            />
            <View className="gap-2">
              <Label>Renda familiar</Label>
              <View className="flex-row flex-wrap gap-2">
                {FAMILY_INCOME_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => updateForm('family_income', option)}
                    className={`rounded-lg border px-3 py-2 ${
                      form.family_income === option
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        form.family_income === option ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View className="gap-2">
              <Label>Observações sobre composição</Label>
              <Textarea
                value={form.family_composition_notes}
                onChangeText={(v) => updateForm('family_composition_notes', v)}
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View className="gap-3">
            <Text className="font-medium text-foreground">Benefícios governamentais</Text>
            <BooleanField
              label="Recebe auxílio governamental"
              checked={form.receives_government_aid}
              onChange={(v) => updateForm('receives_government_aid', v)}
            />
            <BooleanField
              label="Bolsa Família"
              checked={form.receives_bolsa_familia}
              onChange={(v) => updateForm('receives_bolsa_familia', v)}
            />
            <BooleanField
              label="Auxílio Gás"
              checked={form.receives_auxilio_gas}
              onChange={(v) => updateForm('receives_auxilio_gas', v)}
            />
            <BooleanField
              label="BPC"
              checked={form.receives_bpc}
              onChange={(v) => updateForm('receives_bpc', v)}
            />
            <BooleanField
              label="LOAS"
              checked={form.receives_loas}
              onChange={(v) => updateForm('receives_loas', v)}
            />
            <BooleanField
              label="Outro auxílio"
              checked={form.receives_other_aid}
              onChange={(v) => updateForm('receives_other_aid', v)}
            />
            {form.receives_other_aid ? (
              <View className="gap-2">
                <Label>Descrição do outro auxílio</Label>
                <Input
                  value={form.other_aid_description}
                  onChangeText={(v) => updateForm('other_aid_description', v)}
                />
              </View>
            ) : null}
            <Text className="mt-2 font-medium text-foreground">Vulnerabilidades</Text>
            <BooleanField
              label="Insegurança alimentar"
              checked={form.food_insecurity}
              onChange={(v) => updateForm('food_insecurity', v)}
            />
            <BooleanField
              label="Desemprego"
              checked={form.unemployment}
              onChange={(v) => updateForm('unemployment', v)}
            />
            <BooleanField
              label="Problemas de saúde"
              checked={form.poor_health}
              onChange={(v) => updateForm('poor_health', v)}
            />
            <BooleanField
              label="Abuso de substâncias"
              checked={form.substance_abuse}
              onChange={(v) => updateForm('substance_abuse', v)}
            />
            <BooleanField
              label="Doença crônica"
              checked={form.has_chronic_disease}
              onChange={(v) => updateForm('has_chronic_disease', v)}
            />
            {form.has_chronic_disease ? (
              <View className="gap-2">
                <Label>Descrição da doença crônica</Label>
                <Input
                  value={form.chronic_disease_description}
                  onChangeText={(v) => updateForm('chronic_disease_description', v)}
                />
              </View>
            ) : null}
            <View className="gap-2">
              <Label>Outras vulnerabilidades</Label>
              <Textarea
                value={form.other_vulnerabilities}
                onChangeText={(v) => updateForm('other_vulnerabilities', v)}
                placeholder="Descreva outras vulnerabilidades identificadas"
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View className="gap-3">
            <ConsentManagement
              consentGiven={consentGiven}
              termSigned={termSigned}
              onConsentChange={setConsentGiven}
              onTermSignedChange={setTermSigned}
            />
            <View className="rounded-lg bg-primary/10 p-3">
              <Text className="text-sm text-primary">
                {mode === 'institution'
                  ? 'A família será automaticamente vinculada à sua instituição após o cadastro.'
                  : 'A família será cadastrada no sistema. Vincule-a às instituições depois, se necessário.'}
              </Text>
            </View>
          </View>
        );

      default: {
        const _exhaustive: never = step;
        return _exhaustive;
      }
    }
  };

  const isLastStep = step === FAMILY_WIZARD_STEPS.length - 1;

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border bg-white p-4">
        <Text className="text-xl font-bold">Cadastrar Família</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {FAMILY_WIZARD_STEPS.map((label, i) => (
            <Badge key={label} variant={step === i ? 'default' : 'outline'}>
              {i + 1}. {label}
            </Badge>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="mb-3 text-lg font-semibold">{FAMILY_WIZARD_STEPS[step]}</Text>
        {error ? (
          <View className="mb-3 rounded-lg border border-danger bg-danger/10 p-3">
            <Text className="text-sm text-danger">{error}</Text>
          </View>
        ) : null}
        {renderStep()}
      </ScrollView>

      <View className="flex-row gap-2 border-t border-border bg-white p-4">
        <Button variant="outline" className="flex-1" onPress={goBack}>
          {step === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        {isLastStep ? (
          <Button
            className="flex-1"
            onPress={handleSubmit}
            loading={createFamily.isPending}
            disabled={!consentGiven}
          >
            Cadastrar
          </Button>
        ) : (
          <Button className="flex-1" onPress={goNext}>
            Continuar
          </Button>
        )}
      </View>
    </View>
  );
}
