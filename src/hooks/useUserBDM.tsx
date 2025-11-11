import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BDMData {
  "BDM ID": number;
  "Full Name": string | null;
  eMail: string | null;
  "Phone Number": string | null;
  Title: string | null;
  "Job Title": string | null;
  [key: string]: any;
}

export function useUserBDM() {
  const { bdmId, user, userRole, displayName: userDisplayName } = useAuth();
  const [bdmData, setBdmData] = useState<BDMData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBDM = async () => {
      if (!bdmId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('BDM')
          .select('*')
          .eq('BDM ID', bdmId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching BDM data:', error);
          return;
        }

        setBdmData(data);
      } catch (error) {
        console.error('Error in useUserBDM:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBDM();
  }, [bdmId]);

  // Generate display values - prioritize display_name from user_roles, then Full Name from BDM table
  const displayName = userDisplayName || bdmData?.["Full Name"] || user?.email?.split('@')[0] || 'User';
  const displayTitle = bdmData?.["Job Title"] || bdmData?.Title || (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User');
  const initials = userDisplayName
    ? userDisplayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : (bdmData?.["Full Name"] 
        ? bdmData["Full Name"].split(' ').map(n => n[0]).join('').toUpperCase()
        : (user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'));

  return {
    bdmData,
    loading,
    userEmail: user?.email || null,
    displayName,
    displayTitle,
    initials,
  };
}
