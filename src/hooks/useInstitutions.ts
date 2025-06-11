
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Institution = Tables<'institutions'>;
type InstitutionInsert = TablesInsert<'institutions'>;
type InstitutionUpdate = TablesUpdate<'institutions'>;

export const useInstitutions = () => {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Institution[];
    },
  });
};

export const useCreateInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (institution: InstitutionInsert) => {
      const { data, error } = await supabase
        .from('institutions')
        .insert(institution)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      toast({
        title: "Sucesso",
        description: "Instituição criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar instituição: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: InstitutionUpdate }) => {
      const { data, error } = await supabase
        .from('institutions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      toast({
        title: "Sucesso",
        description: "Instituição atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar instituição: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('institutions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      toast({
        title: "Sucesso",
        description: "Instituição excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir instituição: " + error.message,
        variant: "destructive",
      });
    },
  });
};
