import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient, getUserFromReq } from '../_shared/auth.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const supabase = getSupabaseClient(req)
    const user = await getUserFromReq(req)

    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const responseProfile = profile || {
      user_id: user.id,
      first_name: user.user_metadata?.first_name || 'Farmer',
      last_name: user.user_metadata?.last_name || 'User',
      email: user.email,
      role: user.user_metadata?.role || 'farmer'
    }

    return jsonResponse({
      success: true,
      data: responseProfile
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
