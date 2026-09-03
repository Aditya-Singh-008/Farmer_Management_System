import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient, getUserFromReq, parseLimit } from '../_shared/auth.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const user = await getUserFromReq(req)
    if (!user) return errorResponse('Unauthorized', 401)

    const limit = parseLimit(req, 50, 100)
    const supabase = getSupabaseClient(req)

    const { data: sales } = await supabase
      .from('orders')
      .select('*, marketplace_listings(crop_id, price_per_unit)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: purchases } = await supabase
      .from('orders')
      .select('*, marketplace_listings(crop_id, price_per_unit)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    return jsonResponse({
      success: true,
      data: {
        sales: sales || [],
        purchases: purchases || []
      }
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
