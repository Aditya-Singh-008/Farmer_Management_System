import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient, getUserFromReq, parseLimit } from '../_shared/auth.ts'
import { demoData } from '../_shared/demo-data.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const limit = parseLimit(req, 50, 100)
    const supabase = getSupabaseClient(req)
    const user = await getUserFromReq(req)

    let inventoryItems: any[] = []
    if (user) {
      const { data: farms } = await supabase
        .from('farms')
        .select('farm_id')
        .eq('user_id', user.id)

      const farmIds = farms ? farms.map((f: any) => f.farm_id) : []

      if (farmIds.length > 0) {
        const { data } = await supabase
          .from('inventory')
          .select('*, inputs(name, category, unit), farms(farm_name)')
          .in('farm_id', farmIds)
          .order('added_on', { ascending: false })
          .limit(limit)

        inventoryItems = (data || []).map((item: any) => ({
          ...item,
          input_name: item.inputs?.name || 'Input Item',
          category: item.inputs?.category || 'General',
          unit: item.unit || item.inputs?.unit || 'units',
          farm_name: item.farms?.farm_name || 'Farm'
        }))
      }
    }

    return jsonResponse({
      success: true,
      data: inventoryItems,
      demo: {
        inventory: demoData.inventory
      }
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
