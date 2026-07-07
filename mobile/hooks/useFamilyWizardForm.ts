import { useEffect } from 'react';
import { useForm, type Path, type PathValue } from 'react-hook-form';
import { formatCpf } from '@/utils/documentFormat';
import { DEFAULT_FAMILY_FORM, type FamilyFormData } from '@/types/familyForm';

export function useFamilyWizardForm(initialCpf?: string) {
  const formMethods = useForm<FamilyFormData>({
    defaultValues: DEFAULT_FAMILY_FORM,
    mode: 'onSubmit',
  });

  const { watch, setValue, getValues } = formMethods;
  const form = watch();

  useEffect(() => {
    if (initialCpf) {
      setValue('cpf', formatCpf(initialCpf));
    }
  }, [initialCpf, setValue]);

  const updateForm = <K extends Path<FamilyFormData>>(key: K, value: PathValue<FamilyFormData, K>) => {
    setValue(key, value, { shouldDirty: true });
  };

  const syncChildrenAges = (count: number) => {
    const current = getValues();
    const ages = [...current.children_ages];
    while (ages.length < count) ages.push(0);
    while (ages.length > count) ages.pop();
    setValue('children_count', count, { shouldDirty: true });
    setValue('children_ages', ages, { shouldDirty: true });
  };

  return {
    form,
    updateForm,
    syncChildrenAges,
    getValues,
  };
}
