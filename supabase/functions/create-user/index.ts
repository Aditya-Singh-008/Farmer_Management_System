import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getServiceSupabaseClient } from '../_shared/auth.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const body = await req.json().catch(() => ({}))
    const { first_name, last_name, email, password, role } = body
    if (!email || !password) {
      return errorResponse('Email and password are required', 400)
    }

    const supabase = getServiceSupabaseClient()
    
    // Create user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, role: role || 'farmer' }
    })

    if (authError) {
      return errorResponse(authError.message, 400)
    }

    // Insert into public.users and public.user_profile
    if (authData?.user) {
      await supabase.from('users').upsert({
        user_id: authData.user.id,
        auth_user_id: authData.user.id,
        first_name: first_name || 'Farmer',
        last_name: last_name || 'User',
        email: email,
        role: role || 'farmer'
      })

      await supabase.from('user_profile').upsert({
        user_id: authData.user.id,
        first_name: first_name || 'Farmer',
        last_name: last_name || 'User',
        email: email
      })
    }

    return jsonResponse({
      success: true,
      user: authData.user,
      message: 'Account created successfully'
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
