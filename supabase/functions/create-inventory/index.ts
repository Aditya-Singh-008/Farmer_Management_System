import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient, getUserFromReq } from '../_shared/auth.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const user = await getUserFromReq(req)
    if (!user) return errorResponse('Unauthorized', 401)

    const payload = await req.json().catch(() => ({}))
    const supabase = getSupabaseClient(req)

    const { data, error } = await supabase
      .from('inventory')
      .insert({
        farm_id: payload.farm_id,
        input_id: payload.input_id || null,
        quantity: payload.quantity || 0,
        unit: payload.unit || 'units'
      })
      .select()

    if (error) return errorResponse(error.message, 400)
    return jsonResponse({ success: true, data })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
