import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient, getUserFromReq, parseLimit } from '../_shared/auth.ts'
import { demoData } from '../_shared/demo-data.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const limit = parseLimit(req, 10, 50)
    const supabase = getSupabaseClient(req)
    const user = await getUserFromReq(req)

    let listings: any[] = []

    if (user) {
      const userRole = user.user_metadata?.role || 'farmer'

      if (userRole === 'buyer') {
        // Buyer views all active marketplace listings
        const { data } = await supabase
          .from('marketplace_listings')
          .select('*, crops(crop_name), farms(farm_name, user_id)')
          .eq('status', 'active')
          .order('listed_on', { ascending: false })
          .limit(limit)

        listings = (data || []).map((l: any) => ({
          ...l,
          crop_name: l.crops?.crop_name || 'Crop Produce',
          farm_name: l.farms?.farm_name || 'Farm',
          seller_name: 'Verified Farmer'
        }))
      } else {
        // Farmer views their own listings
        const { data: farms } = await supabase
          .from('farms')
          .select('farm_id')
          .eq('user_id', user.id)

        const farmIds = farms ? farms.map((f: any) => f.farm_id) : []

        if (farmIds.length > 0) {
          const { data } = await supabase
            .from('marketplace_listings')
            .select('*, crops(crop_name), farms(farm_name)')
            .in('farm_id', farmIds)
            .order('listed_on', { ascending: false })
            .limit(limit)

          listings = (data || []).map((l: any) => ({
            ...l,
            crop_name: l.crops?.crop_name || 'Crop Produce',
            farm_name: l.farms?.farm_name || 'Farm'
          }))
        }
      }
    } else {
      // Public active listings
      const { data } = await supabase
        .from('marketplace_listings')
        .select('*, crops(crop_name), farms(farm_name)')
        .eq('status', 'active')
        .order('listed_on', { ascending: false })
        .limit(limit)

      listings = (data || []).map((l: any) => ({
        ...l,
        crop_name: l.crops?.crop_name || 'Crop Produce',
        farm_name: l.farms?.farm_name || 'Farm'
      }))
    }

    return jsonResponse({
      success: true,
      data: listings,
      demo: {
        listing: demoData.listing
      }
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
