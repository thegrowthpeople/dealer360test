import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QualificationFramework } from '@/types/qualificationScorecard';

export function useFrameworks(includeInactive: boolean = false) {
  const { data: frameworks = [], isLoading, error } = useQuery({
    queryKey: ['qualification-frameworks', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('QualificationFrameworks')
        .select('*')
        .order('display_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

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
