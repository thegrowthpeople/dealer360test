import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QualificationFramework } from '@/types/qualificationScorecard';

export function useFrameworks() {
  const { data: frameworks = [], isLoading, error } = useQuery({
    queryKey: ['qualification-frameworks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('QualificationFrameworks')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as QualificationFramework[];
    },
  });

  // Get default framework (FAINT)
  const defaultFramework = frameworks.find(f => f.name === 'FAINT') || frameworks[0];

  return {
    frameworks,
    defaultFramework,
    isLoading,
    error,
  };
}
