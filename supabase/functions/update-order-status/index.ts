import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient, getUserFromReq } from '../_shared/auth.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const user = await getUserFromReq(req)
    if (!user) return errorResponse('Unauthorized', 401)

    const { order_id, status } = await req.json().catch(() => ({}))
    if (!order_id || !status) return errorResponse('order_id and status are required', 400)

    const supabase = getSupabaseClient(req)

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', order_id)
      .select()

    if (error) return errorResponse(error.message, 400)
    return jsonResponse({ success: true, data })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
