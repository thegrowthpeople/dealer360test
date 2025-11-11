import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BDMData {
  "BDM ID": number;
  "Full Name": string | null;
  eMail: string | null;
  "Phone Number": string | null;
  Title: string | null;
  [key: string]: any;
}

export function useUserBDM() {
  const { bdmId, user } = useAuth();
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
          .single();

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

  return {
    bdmData,
    loading,
    userEmail: user?.email || null,
  };
}
