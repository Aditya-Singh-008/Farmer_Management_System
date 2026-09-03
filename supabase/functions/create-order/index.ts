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

    const items = payload.items || [payload]
    const createdOrders = []

    for (const item of items) {
      const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('*, farms(user_id)')
        .eq('listing_id', item.listing_id)
        .single()

      if (listing) {
        const sellerId = listing.farms?.user_id
        const totalPrice = Number(item.quantity || 1) * Number(listing.price_per_unit || 0)

        const { data: order } = await supabase
          .from('orders')
          .insert({
            listing_id: item.listing_id,
            buyer_id: user.id,
            seller_id: sellerId,
            quantity: item.quantity || 1,
            total_price: totalPrice,
            status: 'pending'
          })
          .select()
          .single()

        if (order) createdOrders.push(order)
      }
    }

    return jsonResponse({ success: true, data: createdOrders })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
