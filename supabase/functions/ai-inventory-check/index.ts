// ai-inventory-check/index.ts — AI Inventory Anomaly Detection Edge Function
// GET — scans the authenticated user's inventory vs their active crops and returns smart alerts.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getUserFromReq, getSupabaseClient } from '../_shared/auth.ts'
import { callGeminiFlash, parseGeminiJson } from '../_shared/gemini.ts'

interface Alert {
  severity: 'low' | 'medium' | 'high'
  title: string
  message: string
  action: string
  icon: string
}

interface InventoryCheckResponse {
  alerts: Alert[]
  summary: string
  health_score: number   // 0-100, 100 = all good
  checked_at: string
}

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const user = await getUserFromReq(req)
    if (!user) return errorResponse('Unauthorized', 401)

    const supabase = getSupabaseClient(req)

    // Fetch all farms for this user
    const { data: farms } = await supabase
      .from('farms')
      .select('farm_id, farm_name, area, soil_type')
      .eq('user_id', user.id)

    const farmIds = (farms || []).map((f: any) => f.farm_id)

    // Fetch active crops
    const { data: crops } = farmIds.length
      ? await supabase
          .from('crops')
          .select('crop_id, crop_name, crop_type, area, status, sowing_date, expected_harvest, expected_yield')
          .in('farm_id', farmIds)
          .in('status', ['planted', 'growing', 'flowering'])
      : { data: [] }

    // Fetch current inventory
    const { data: inventory } = farmIds.length
      ? await supabase
          .from('inventory')
          .select('inventory_id, quantity, unit, inputs(name, category)')
          .in('farm_id', farmIds)
      : { data: [] }

    const cropsData = (crops || []).map((c: any) => ({
      name: c.crop_name,
      type: c.crop_type,
      area: c.area,
      status: c.status,
      expected_harvest: c.expected_harvest,
    }))

    const inventoryData = (inventory || []).map((i: any) => ({
      name: i.inputs?.name || 'Unknown Item',
      category: i.inputs?.category || 'General',
      quantity: i.quantity,
      unit: i.unit,
    }))

    // If no data at all, return empty healthy state
    if (cropsData.length === 0 && inventoryData.length === 0) {
      return jsonResponse({
        success: true,
        data: {
          alerts: [],
          summary: 'No active crops or inventory to analyze.',
          health_score: 100,
          checked_at: new Date().toISOString(),
        } as InventoryCheckResponse,
      })
    }

    const prompt = `
You are an expert agricultural inventory manager. Analyze the following farm data and identify inventory problems.

ACTIVE CROPS (${cropsData.length} crops):
${JSON.stringify(cropsData, null, 2)}

CURRENT INVENTORY (${inventoryData.length} items):
${JSON.stringify(inventoryData, null, 2)}

Analyze mismatches, shortages, surpluses, or risks. Return ONLY valid JSON (no markdown):
{
  "alerts": [
    {
      "severity": "high" | "medium" | "low",
      "title": "<short title, max 8 words>",
      "message": "<actionable insight, max 25 words>",
      "action": "<recommended action, max 10 words>",
      "icon": "<single emoji that fits the alert>"
    }
  ],
  "summary": "<One sentence overall assessment>",
  "health_score": <integer 0-100, 100=healthy>
}

Rules:
- Generate 2-5 alerts total (none if everything is fine)
- Focus on: low fertilizer for crop count, missing pesticides near harvest, excess inventory of unused items, missing water/irrigation supplies
- If inventory is empty but crops exist, always flag as high severity
- If all looks good, return empty alerts array and score 90-100
- Be specific: mention actual crop names and inventory item names
`

    const rawResponse = await callGeminiFlash(prompt)
    const result = parseGeminiJson<{ alerts: Alert[]; summary: string; health_score: number }>(rawResponse)

    return jsonResponse({
      success: true,
      data: {
        alerts: result.alerts || [],
        summary: result.summary || 'Analysis complete.',
        health_score: result.health_score ?? 100,
        checked_at: new Date().toISOString(),
      } as InventoryCheckResponse,
    })
  } catch (err: any) {
    console.error('[ai-inventory-check] Error:', err)
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
