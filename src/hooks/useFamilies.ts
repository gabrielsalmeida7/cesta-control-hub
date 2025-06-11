
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Family = Tables<'families'>;
type FamilyInsert = TablesInsert<'families'>;
type FamilyUpdate = TablesUpdate<'families'>;

export const useFamilies = () => {
  return useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('families')
        .select(`
          *,
          blocked_by_institution:blocked_by_institution_id(name)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useInstitutionFamilies = (institutionId?: string) => {
  return useQuery({
    queryKey: ['institution-families', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      
      const { data, error } = await supabase
        .from('families')
        .select(`
          *,
          blocked_by_institution:blocked_by_institution_id(name),
          institution_families!inner(institution_id)
        `)
        .eq('institution_families.institution_id', institutionId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });
};

export const useCreateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (family: FamilyInsert) => {
      const { data, error } = await supabase
        .from('families')
        .insert(family)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      toast({
        title: "Sucesso",
        description: "Família criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar família: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FamilyUpdate }) => {
      const { data, error } = await supabase
        .from('families')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['institution-families'] });
      toast({
        title: "Sucesso",
        description: "Família atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar família: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['institution-families'] });
      toast({
        title: "Sucesso",
        description: "Família excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir família: " + error.message,
        variant: "destructive",
      });
    },
  });
};
