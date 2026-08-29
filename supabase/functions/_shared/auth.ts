import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://utrqtyocuziqsxwborup.supabase.co'
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  const authHeader = req.headers.get('Authorization')
  
  if (authHeader) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
  }

  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
}

export function getServiceSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://utrqtyocuziqsxwborup.supabase.co'
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function getUserFromReq(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null

  const supabase = getSupabaseClient(req)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

export function parseLimit(req: Request, defaultLimit = 5, maxLimit = 50) {
  const url = new URL(req.url)
  const limitParam = url.searchParams.get('limit')
  if (!limitParam) return defaultLimit
  const parsed = parseInt(limitParam, 10)
  if (isNaN(parsed) || parsed <= 0) return defaultLimit
  return Math.min(parsed, maxLimit)
}
