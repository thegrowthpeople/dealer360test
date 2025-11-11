import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    // Fetch all users
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) throw usersError;

    // Fetch roles
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role, bdm_id');

    if (rolesError) throw rolesError;

    // Fetch BDMs
    const { data: bdmsData, error: bdmsError } = await supabaseAdmin
      .from('BDM')
      .select('"BDM ID", "Full Name"')
      .eq('Active', 1);

    if (bdmsError) throw bdmsError;

    // Combine data
    const usersWithRoles = usersData.users.map(u => {
      const userRole = rolesData?.find(r => r.user_id === u.id);
      const bdm = bdmsData?.find(b => b['BDM ID'] === userRole?.bdm_id);
      
      return {
        id: u.id,
        email: u.email || '',
        created_at: u.created_at,
        role: userRole?.role || 'user',
        bdm_id: userRole?.bdm_id || null,
        bdm_name: bdm?.['Full Name'] || null,
      };
    });

    return new Response(
      JSON.stringify({ users: usersWithRoles, bdms: bdmsData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Error in list-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
