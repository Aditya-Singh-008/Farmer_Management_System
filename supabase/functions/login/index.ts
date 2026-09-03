import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/auth.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const { email, password } = await req.json().catch(() => ({}))
    if (!email || !password) {
      return errorResponse('Email and password are required', 400)
    }

    const supabase = getSupabaseClient(req)

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.session) {
      return errorResponse(authError?.message || 'Invalid email or password', 401)
    }

    // Get user profile if exists
    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    const userObj = {
      id: authData.user.id,
      user_id: profile?.profile_id || authData.user.id,
      auth_user_id: authData.user.id,
      email: authData.user.email,
      first_name: profile?.first_name || authData.user.user_metadata?.first_name || 'Farmer',
      last_name: profile?.last_name || authData.user.user_metadata?.last_name || 'User',
      role: profile?.role || authData.user.user_metadata?.role || 'farmer'
    }

    return jsonResponse({
      success: true,
      session: authData.session,
      user: userObj
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
