import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get request body
    const { userId, email, role, bdm_id, display_name } = await req.json();

    console.log('Updating user:', { userId, email, role, bdm_id, display_name });

    // Validate required fields
    if (!userId || !role) {
      throw new Error('Missing required fields');
    }

    // Validate BDM requirement for user role
    if (role === 'user' && !bdm_id) {
      throw new Error('BDM is required for users with user role');
    }

    // Update email and display_name in auth metadata
    const authUpdateData: any = {};
    
    if (email) {
      authUpdateData.email = email;
    }
    
    // Always update user_metadata with display_name if provided
    if (display_name !== undefined) {
      authUpdateData.user_metadata = { display_name };
    }

    if (Object.keys(authUpdateData).length > 0) {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdateData
      );

      if (updateAuthError) {
        console.error('Error updating auth user:', updateAuthError);
        throw updateAuthError;
      }
    }

    console.log('Auth user updated with metadata:', authUpdateData);

    // Update role, BDM, and display name in user_roles table
    const { error: roleUpdateError } = await supabaseAdmin
      .from('user_roles')
      .update({
        role,
        bdm_id,
        display_name,
      })
      .eq('user_id', userId);

    if (roleUpdateError) {
      console.error('Error updating role:', roleUpdateError);
      throw new Error('Failed to update user role');
    }

    console.log('User updated successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Error in update-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
