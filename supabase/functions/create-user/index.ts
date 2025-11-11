import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    // Parse request body
    const { email, password, role, bdm_id } = await req.json()

    // Validate required fields
    if (!email || !password || !role) {
      throw new Error('Missing required fields')
    }

    // Validate role
    if (!['admin', 'manager', 'user'].includes(role)) {
      throw new Error('Invalid role')
    }

    // Validate BDM requirement for users
    if (role === 'user' && !bdm_id) {
      throw new Error('BDM is required for users')
    }

    console.log('Creating user:', { email, role, bdm_id })

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      console.error('Error creating user:', createError)
      throw createError
    }

    console.log('User created:', newUser.user.id)

    // Insert role and BDM association
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role,
        bdm_id: bdm_id || null,
      })

    if (roleInsertError) {
      console.error('Error inserting role:', roleInsertError)
      // Rollback: delete the user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw roleInsertError
    }

    console.log('Role assigned successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in create-user function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
