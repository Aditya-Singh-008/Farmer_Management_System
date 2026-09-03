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
      .from('marketplace_listings')
      .insert({
        farm_id: payload.farm_id,
        crop_id: payload.crop_id,
        price_per_unit: payload.price_per_unit || payload.price,
        available_qty: payload.available_qty || payload.quantity,
        harvest_date: payload.harvest_date || null,
        notes: payload.notes || null,
        status: 'active'
      })
      .select()

    if (error) return errorResponse(error.message, 400)
    return jsonResponse({ success: true, data })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
