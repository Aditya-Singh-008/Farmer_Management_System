import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient, getUserFromReq, parseLimit } from '../_shared/auth.ts'

serve(async (req) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const supabase = getSupabaseClient(req)
    const user = await getUserFromReq(req)

    if (req.method === 'POST') {
      const payload = await req.json().catch(() => ({}))
      if (!payload.title) {
        return errorResponse('Task title is required', 400)
      }

      if (user) {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: payload.title,
            field: payload.field || payload.customField || 'General Field',
            due_date: payload.due || payload.due_date || null,
            notes: payload.notes || null,
            status: payload.status || 'scheduled'
          })
          .select()
          .single()

        if (error) return errorResponse(error.message, 400)
        return jsonResponse({ success: true, data })
      } else {
        return jsonResponse({
          success: true,
          data: {
            task_id: Date.now(),
            title: payload.title,
            field: payload.field || 'General Field',
            due_date: payload.due || 'Tomorrow',
            status: 'scheduled'
          }
        })
      }
    }

    // GET request
    const limit = parseLimit(req, 20, 100)
    let tasks: any[] = []

    if (user) {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      tasks = data || []
    }

    if (tasks.length === 0) {
      tasks = [
        {
          task_id: 1,
          title: 'Irrigation Check',
          field: 'North Wheat Field',
          due_date: '2025-03-01',
          status: 'scheduled'
        },
        {
          task_id: 2,
          title: 'Fertilizer Application',
          field: 'South Corn Field',
          due_date: '2025-03-05',
          status: 'scheduled'
        }
      ]
    }

    return jsonResponse({
      success: true,
      data: tasks
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
