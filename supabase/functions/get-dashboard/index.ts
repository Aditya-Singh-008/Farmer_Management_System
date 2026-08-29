import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient, getUserFromReq, parseLimit } from '../_shared/auth.ts'
import { demoData } from '../_shared/demo-data.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const limit = parseLimit(req, 5, 50)
    const supabase = getSupabaseClient(req)
    const user = await getUserFromReq(req)

    let profile = null
    let farmsCount = 0
    let cropsCount = 0
    let inventoryCount = 0
    let listingsCount = 0
    let recentCrops: any[] = []
    let recentListings: any[] = []

    if (user) {
      // Get profile
      const { data: prof } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      profile = prof || {
        first_name: user.user_metadata?.first_name || 'Farmer',
        last_name: user.user_metadata?.last_name || 'User',
        email: user.email,
        role: user.user_metadata?.role || 'farmer'
      }

      // Get farms
      const { data: farms } = await supabase
        .from('farms')
        .select('farm_id, farm_name')
        .eq('user_id', user.id)

      const farmIds = farms ? farms.map((f: any) => f.farm_id) : []
      farmsCount = farmIds.length

      if (farmIds.length > 0) {
        // Crops count & recent crops
        const { count: cCount } = await supabase
          .from('crops')
          .select('*', { count: 'exact', head: true })
          .in('farm_id', farmIds)
        cropsCount = cCount || 0

        const { data: crops } = await supabase
          .from('crops')
          .select('*, farms(farm_name)')
          .in('farm_id', farmIds)
          .order('created_at', { ascending: false })
          .limit(limit)
        recentCrops = crops || []

        // Inventory count
        const { count: iCount } = await supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true })
          .in('farm_id', farmIds)
        inventoryCount = iCount || 0

        // Listings count & recent listings
        const { count: lCount } = await supabase
          .from('marketplace_listings')
          .select('*', { count: 'exact', head: true })
          .in('farm_id', farmIds)
        listingsCount = lCount || 0

        const { data: listings } = await supabase
          .from('marketplace_listings')
          .select('*, crops(crop_name), farms(farm_name)')
          .in('farm_id', farmIds)
          .order('listed_on', { ascending: false })
          .limit(limit)
        recentListings = listings || []
      }
    }

    return jsonResponse({
      success: true,
      data: {
        profile: profile || { first_name: 'Farmer', last_name: 'User', email: 'farmer@example.com', role: 'farmer' },
        counts: {
          farms_count: farmsCount,
          crops_count: cropsCount,
          inventory_count: inventoryCount,
          listings_count: listingsCount
        },
        recent_crops: recentCrops,
        recent_listings: recentListings
      },
      demo: {
        crop: demoData.crop,
        listing: demoData.listing,
        farm: demoData.farm,
        inventory: demoData.inventory
      }
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
