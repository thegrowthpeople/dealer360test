import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseScorecard, CreateScorecardInput, UpdateScorecardInput } from '@/types/qualificationScorecard';
import { toast } from 'sonner';

export function useScorecards() {
  const { user, bdmId, userRole } = useAuth();
  const queryClient = useQueryClient();

  // Fetch scorecards with role-based filtering
  const { data: scorecards = [], isLoading, error } = useQuery({
    queryKey: ['scorecards', bdmId, userRole],
    queryFn: async () => {
      let query = supabase
        .from('QualificationScorecards')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (userRole === 'user' && bdmId) {
        query = query.eq('bdm_id', bdmId);
      } else if (userRole === 'manager' && bdmId) {
        query = query.eq('bdm_id', bdmId);
      }
      // Admins and managers without BDM see all

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching scorecards:', error);
        throw error;
      }

      return data as DatabaseScorecard[];
    },
    enabled: !!user,
  });

  // Set up real-time subscriptions for live updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('qualification-scorecards-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'QualificationScorecards'
        },
        (payload) => {
          console.log('Scorecard inserted:', payload.new);
          const newScorecard = payload.new as DatabaseScorecard;
          
          // Check if user should see this scorecard based on role
          const shouldShow = 
            userRole === 'admin' || 
            (userRole === 'manager' && (!bdmId || newScorecard.bdm_id === bdmId)) ||
            (userRole === 'user' && newScorecard.bdm_id === bdmId);
          
          if (shouldShow && !newScorecard.archived) {
            queryClient.invalidateQueries({ queryKey: ['scorecards'] });
            toast.info('New scorecard added', {
              description: `${newScorecard.opportunity_name} - ${newScorecard.customer_name}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'QualificationScorecards'
        },
        (payload) => {
          console.log('Scorecard updated:', payload.new);
          const updatedScorecard = payload.new as DatabaseScorecard;
          
          // Check if user should see this scorecard based on role
          const shouldShow = 
            userRole === 'admin' || 
            (userRole === 'manager' && (!bdmId || updatedScorecard.bdm_id === bdmId)) ||
            (userRole === 'user' && updatedScorecard.bdm_id === bdmId);
          
          if (shouldShow) {
            queryClient.invalidateQueries({ queryKey: ['scorecards'] });
            
            // Only show toast if the update was made by another user
            if (updatedScorecard.created_by !== user.id) {
              toast.info('Scorecard updated', {
                description: `${updatedScorecard.opportunity_name} was modified`,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'QualificationScorecards'
        },
        (payload) => {
          console.log('Scorecard deleted:', payload.old);
          queryClient.invalidateQueries({ queryKey: ['scorecards'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, bdmId, userRole, queryClient]);

  // Create new scorecard
  const createScorecard = useMutation({
    mutationFn: async (input: CreateScorecardInput) => {
      const { data, error } = await supabase
        .from('QualificationScorecards')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DatabaseScorecard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
      // Real-time will notify other users
    },
    onError: (error: any) => {
      console.error('Error creating scorecard:', error);
      toast.error('Failed to create scorecard');
    },
  });

  // Update existing scorecard
  const updateScorecard = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateScorecardInput) => {
      const { data, error } = await supabase
        .from('QualificationScorecards')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DatabaseScorecard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
      // Real-time will notify other users
    },
    onError: (error: any) => {
      console.error('Error updating scorecard:', error);
      toast.error('Failed to update scorecard');
    },
  });

  // Delete scorecard (soft delete by archiving)
  const deleteScorecard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('QualificationScorecards')
        .update({ archived: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
      // Real-time will notify other users
    },
    onError: (error: any) => {
      console.error('Error archiving scorecard:', error);
      toast.error('Failed to archive scorecard');
    },
  });

  // Duplicate scorecard with new version
  const duplicateScorecard = useMutation({
    mutationFn: async (scorecard: DatabaseScorecard) => {
      // Get the latest version number
      const { data: latestVersion, error: versionError } = await supabase
        .rpc('get_latest_scorecard_version', {
          p_opportunity_name: scorecard.opportunity_name,
          p_customer_name: scorecard.customer_name,
        });

      if (versionError) throw versionError;

      const newVersion = (latestVersion || 0) + 1;

      const { data, error } = await supabase
        .from('QualificationScorecards')
        .insert({
          account_manager: scorecard.account_manager,
          customer_name: scorecard.customer_name,
          opportunity_name: scorecard.opportunity_name,
          expected_order_date: scorecard.expected_order_date,
          review_date: new Date().toISOString().split('T')[0],
          bdm_id: scorecard.bdm_id,
          framework_id: scorecard.framework_id,
          funds: scorecard.funds,
          authority: scorecard.authority,
          interest: scorecard.interest,
          need: scorecard.need,
          timing: scorecard.timing,
          tags: scorecard.tags,
          version: newVersion,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DatabaseScorecard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
      toast.success('New version created successfully');
    },
    onError: (error: any) => {
      console.error('Error duplicating scorecard:', error);
      toast.error('Failed to create new version');
    },
  });

  // Toggle pin
  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('QualificationScorecards')
        .update({ pinned })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
    },
    onError: (error: any) => {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update pin status');
    },
  });

  return {
    scorecards,
    isLoading,
    error,
    createScorecard: createScorecard.mutateAsync,
    updateScorecard: updateScorecard.mutateAsync,
    deleteScorecard: deleteScorecard.mutateAsync,
    duplicateScorecard: duplicateScorecard.mutateAsync,
    togglePin: togglePin.mutateAsync,
  };
}
