import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QualificationFramework, FrameworkStructure } from '@/types/qualificationScorecard';
import { toast } from 'sonner';

export function useFrameworkManagement() {
  const queryClient = useQueryClient();

  const createFramework = useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      structure: FrameworkStructure;
      display_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('QualificationFrameworks')
        .insert([{
          name: input.name,
          description: input.description,
          structure: input.structure,
          display_order: input.display_order || 0,
          active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as QualificationFramework;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualification-frameworks'] });
      toast.success('Framework created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating framework:', error);
      toast.error('Failed to create framework: ' + error.message);
    },
  });

  const updateFramework = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      structure?: FrameworkStructure;
      active?: boolean;
      display_order?: number;
    }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('QualificationFrameworks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as QualificationFramework;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualification-frameworks'] });
      toast.success('Framework updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating framework:', error);
      toast.error('Failed to update framework: ' + error.message);
    },
  });

  const deleteFramework = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('QualificationFrameworks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualification-frameworks'] });
      toast.success('Framework deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting framework:', error);
      toast.error('Failed to delete framework: ' + error.message);
    },
  });

  return {
    createFramework: createFramework.mutateAsync,
    updateFramework: updateFramework.mutateAsync,
    deleteFramework: deleteFramework.mutateAsync,
    isCreating: createFramework.isPending,
    isUpdating: updateFramework.isPending,
    isDeleting: deleteFramework.isPending,
  };
}
