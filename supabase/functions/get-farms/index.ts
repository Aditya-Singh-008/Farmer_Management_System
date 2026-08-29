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

    let farms: any[] = []
    if (user) {
      const { data } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      farms = data || []
    }

    return jsonResponse({
      success: true,
      data: farms,
      demo: {
        farm: demoData.farm
      }
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
