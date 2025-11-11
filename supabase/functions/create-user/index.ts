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
    const { email, password, role, bdm_id } = await req.json();

    console.log('Creating user:', { email, role, bdm_id });

    // Validate required fields
    if (!email || !password || !role) {
      throw new Error('Missing required fields');
    }

    // Validate BDM requirement for user role
    if (role === 'user' && !bdm_id) {
      throw new Error('BDM is required for users with user role');
    }

    // Create user in auth.users
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('User created in auth:', newUser.user.id);

    // Insert role and BDM into user_roles table
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role,
        bdm_id,
      });

    if (roleInsertError) {
      console.error('Error inserting role:', roleInsertError);
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error('Failed to assign role. User creation rolled back.');
    }

    console.log('Role assigned successfully');

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
