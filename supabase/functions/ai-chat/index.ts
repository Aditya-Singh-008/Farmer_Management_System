// ai-chat/index.ts — FarmBot AI Advisor & Assistance Edge Function

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getUserFromReq, getSupabaseClient } from '../_shared/auth.ts'
import { callGeminiFlash, parseGeminiJson } from '../_shared/gemini.ts'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  mode?: 'chat' | 'autofill' | 'tasks'
  message?: string
  history?: ChatMessage[]
  crop_name?: string // For autofill mode
}

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const user = await getUserFromReq(req)
    if (!user) return errorResponse('Unauthorized', 401)

    const supabase = getSupabaseClient(req)
    const body: ChatRequest = await req.json()
    const mode = body.mode || 'chat'

    // Fetch user context: Profile & Crops
    const { data: profile } = await supabase
      .from('user_profile')
      .select('first_name, city, state, country')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: farms } = await supabase
      .from('farms')
      .select('farm_id, farm_name, soil_type, area')
      .eq('user_id', user.id)

    const farmIds = (farms || []).map((f: any) => f.farm_id)

    const { data: crops } = farmIds.length
      ? await supabase
          .from('crops')
          .select('crop_name, crop_type, area, status, sowing_date, expected_harvest')
          .in('farm_id', farmIds)
      : { data: [] }

    const farmerName = profile?.first_name || 'Farmer'
    const location = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || 'India'
    const cropsSummary = (crops || []).map((c: any) => `${c.crop_name} (${c.status}, ${c.area} acres)`).join(', ') || 'None registered'
    const farmsSummary = (farms || []).map((f: any) => `${f.farm_name} (${f.soil_type || 'Loamy'} soil)`).join(', ') || 'None registered'

    // -------------------------------------------------------------
    // MODE 1: AUTOFILL FOR CROP REGISTRATION
    // -------------------------------------------------------------
    if (mode === 'autofill') {
      const cropName = body.crop_name
      if (!cropName) return errorResponse('crop_name is required for autofill', 400)

      const autofillPrompt = `
You are an expert agronomist. Provide smart default values for registering a new crop: "${cropName}" in location "${location}".
Return ONLY valid JSON (no markdown):
{
  "crop_type": "<e.g. Cereal / Vegetable / Legume / Cash Crop>",
  "crop_variety": "<popular variety name>",
  "ideal_soil": "<e.g. Loamy / Clay / Sandy>",
  "expected_yield_per_acre": <number in tons/acre>,
  "typical_duration_days": <number of days from sowing to harvest>,
  "notes": "<2-sentence growth & care tip for ${cropName}>"
}
`
      const rawRes = await callGeminiFlash(autofillPrompt)
      const data = parseGeminiJson(rawRes)
      return jsonResponse({ success: true, data })
    }

    // -------------------------------------------------------------
    // MODE 2: SMART TASK GENERATOR
    // -------------------------------------------------------------
    if (mode === 'tasks') {
      const taskPrompt = `
You are FarmBot. Generate a 7-day actionable task schedule for ${farmerName}'s farm in ${location}.
Current Crops: ${cropsSummary}
Farms & Soil: ${farmsSummary}

Return ONLY valid JSON (no markdown):
{
  "tasks": [
    {
      "title": "<short task title>",
      "field": "<farm or crop name>",
      "due_in_days": <number 1 to 7>,
      "notes": "<15 words guidance>",
      "category": "Irrigation" | "Fertilizer" | "Pest Control" | "Inspection" | "Harvest"
    }
  ]
}
Generate 4-6 highly relevant tasks.
`
      const rawRes = await callGeminiFlash(taskPrompt)
      const data = parseGeminiJson(rawRes)
      return jsonResponse({ success: true, data })
    }

    // -------------------------------------------------------------
    // MODE 3: CONVERSATIONAL CHAT (FarmBot Chatbot)
    // -------------------------------------------------------------
    const userMsg = body.message
    if (!userMsg) return errorResponse('message is required', 400)

    const historyStr = (body.history || [])
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'Farmer' : 'FarmBot'}: ${h.content}`)
      .join('\n')

    const chatPrompt = `
You are FarmBot, a friendly, knowledgeable 24/7 AI agricultural expert assisting ${farmerName}.
Location: ${location}
Farms: ${farmsSummary}
Current Active Crops: ${cropsSummary}

Recent Chat History:
${historyStr}

Farmer's Question: "${userMsg}"

Instructions:
- Give a concise, clear, and encouraging answer tailored to the farmer's specific crops and location.
- Use emojis where appropriate.
- Keep response under 150 words unless detailed steps are requested.
- Focus on practical, actionable advice for Indian / local farming context.
- If asked non-agricultural questions, politely steer back to farming.

Response:
`

    const responseText = await callGeminiFlash(chatPrompt)

    // Save to chat history table asynchronously
    try {
      await supabase.from('ai_chat_history').insert([
        { user_id: user.id, role: 'user', content: userMsg },
        { user_id: user.id, role: 'assistant', content: responseText },
      ])
    } catch (dbErr) {
      console.warn('Failed to log chat history:', dbErr)
    }

    return jsonResponse({
      success: true,
      data: {
        response: responseText,
        farmer_name: farmerName,
      },
    })
  } catch (err: any) {
    console.error('[ai-chat] Error:', err)
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
