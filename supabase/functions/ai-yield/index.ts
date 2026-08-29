// ai-yield/index.ts — AI Yield Predictor Edge Function
// POST body: { crop_name, area, soil_type, sowing_date, expected_yield, crop_type, location }
// Returns: { predicted_min, predicted_max, confidence_pct, risks, tips, growth_stages }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getUserFromReq, getServiceSupabaseClient } from '../_shared/auth.ts'
import { callGeminiFlash, parseGeminiJson } from '../_shared/gemini.ts'

interface YieldRequest {
  crop_id?: number
  crop_name: string
  area?: number
  soil_type?: string
  sowing_date?: string
  expected_yield?: number
  actual_yield?: number
  crop_type?: string
  location?: string
}

interface YieldPrediction {
  predicted_min: number
  predicted_max: number
  confidence_pct: number
  unit: string
  risks: string[]
  tips: string[]
  growth_stages: { stage: string; date: string; description: string }[]
  summary: string
}

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const user = await getUserFromReq(req)
    if (!user) return errorResponse('Unauthorized', 401)

    const body: YieldRequest = await req.json()
    const {
      crop_id,
      crop_name,
      area = 1,
      soil_type = 'loamy',
      sowing_date,
      expected_yield,
      actual_yield,
      crop_type = '',
      location = 'India',
    } = body

    if (!crop_name) return errorResponse('crop_name is required', 400)

    const historyNote =
      expected_yield || actual_yield
        ? `Historical yield data: expected=${expected_yield ?? 'N/A'} tons/acre, actual=${actual_yield ?? 'N/A'} tons/acre.`
        : 'No historical yield data available.'

    const sowingNote = sowing_date
      ? `Sown on ${sowing_date}.`
      : 'Sowing date not provided.'

    // Calculate approximate growth stages from sowing date
    const now = new Date()
    const sowDate = sowing_date ? new Date(sowing_date) : now

    const prompt = `
You are an expert agricultural scientist. Analyze the following crop data and return a JSON prediction.

Crop: ${crop_name} (${crop_type || 'general variety'})
Area: ${area} acres
Soil type: ${soil_type}
Location: ${location}
${sowingNote}
${historyNote}

Return ONLY valid JSON (no markdown, no explanation) in this exact structure:
{
  "predicted_min": <number, yield in tons for this farm total>,
  "predicted_max": <number, yield in tons for this farm total>,
  "confidence_pct": <integer 50-95>,
  "unit": "tons",
  "risks": [<3-4 short risk factors as strings>],
  "tips": [<3-4 actionable tips as strings>],
  "growth_stages": [
    { "stage": "Germination", "date": "<YYYY-MM-DD estimate>", "description": "<10 words max>" },
    { "stage": "Vegetative", "date": "<YYYY-MM-DD estimate>", "description": "<10 words max>" },
    { "stage": "Flowering", "date": "<YYYY-MM-DD estimate>", "description": "<10 words max>" },
    { "stage": "Harvest Ready", "date": "<YYYY-MM-DD estimate>", "description": "<10 words max>" }
  ],
  "summary": "<One sentence summary of the prediction>"
}

Base growth stage dates on the sowing date ${sowDate.toISOString().split('T')[0]} and typical ${crop_name} growth duration.
Be realistic and specific for ${location} agriculture.
`

    const rawResponse = await callGeminiFlash(prompt)
    const prediction = parseGeminiJson<YieldPrediction>(rawResponse)

    // Validate essential fields
    if (
      typeof prediction.predicted_min !== 'number' ||
      typeof prediction.predicted_max !== 'number'
    ) {
      return errorResponse('Invalid prediction format from AI', 500)
    }

    // Optionally store prediction in DB if crop_id provided
    if (crop_id) {
      try {
        const supabase = getServiceSupabaseClient()
        await supabase.from('ai_yield_predictions').insert({
          crop_id,
          user_id: user.id,
          predicted_min: prediction.predicted_min,
          predicted_max: prediction.predicted_max,
          confidence_pct: prediction.confidence_pct,
          risks: prediction.risks,
          tips: prediction.tips,
          growth_stages: prediction.growth_stages,
          summary: prediction.summary,
        })
      } catch (dbErr) {
        // Non-fatal: log but don't fail the request
        console.warn('Failed to store prediction in DB:', dbErr)
      }
    }

    return jsonResponse({
      success: true,
      data: prediction,
    })
  } catch (err: any) {
    console.error('[ai-yield] Error:', err)
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
