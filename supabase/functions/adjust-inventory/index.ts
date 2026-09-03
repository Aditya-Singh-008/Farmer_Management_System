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

    const { inventory_id, adjustment_type, quantity } = payload
    if (!inventory_id) return errorResponse('inventory_id is required', 400)

    const { data: item } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('inventory_id', inventory_id)
      .single()

    let newQty = item ? item.quantity : 0
    if (adjustment_type === 'add') newQty += Number(quantity)
    else if (adjustment_type === 'subtract') newQty = Math.max(0, newQty - Number(quantity))
    else newQty = Number(quantity)

    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity: newQty })
      .eq('inventory_id', inventory_id)
      .select()

    if (error) return errorResponse(error.message, 400)
    return jsonResponse({ success: true, data })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
