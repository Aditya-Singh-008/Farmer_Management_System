import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient, parseLimit } from '../_shared/auth.ts'
import { demoData } from '../_shared/demo-data.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') || ''
    const limit = parseLimit(req, 20, 50)

    if (!q.trim()) {
      return jsonResponse({
        success: true,
        data: { crops: [], listings: [], query: '', total_results: 0 }
      })
    }

    const supabase = getSupabaseClient(req)
    const pattern = `%${q.trim()}%`

    const { data: crops } = await supabase
      .from('crops')
      .select('*, farms(farm_name)')
      .or(`crop_name.ilike.${pattern},crop_type.ilike.${pattern}`)
      .limit(limit)

    const { data: listings } = await supabase
      .from('marketplace_listings')
      .select('*, crops(crop_name), farms(farm_name)')
      .eq('status', 'active')
      .limit(limit)

    const filteredListings = (listings || []).filter((l: any) =>
      l.crops?.crop_name?.toLowerCase().includes(q.toLowerCase()) ||
      l.farms?.farm_name?.toLowerCase().includes(q.toLowerCase())
    )

    return jsonResponse({
      success: true,
      data: {
        crops: crops || [demoData.crop],
        listings: filteredListings || [demoData.listing],
        query: q,
        total_results: (crops?.length || 0) + (filteredListings?.length || 0)
      }
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
