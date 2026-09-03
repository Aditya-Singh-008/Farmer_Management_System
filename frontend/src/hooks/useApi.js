import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

/**
 * useApi — Generic data fetching hook for Edge Functions.
 * Usage: const { data, loading, error, refetch } = useApi(() => api.getCrops())
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      if (res.success === false) {
        setError(res.error || 'Request failed')
      } else {
        setData(res.data !== undefined ? res.data : res)
      }
    } catch (e) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => { execute() }, [execute])

  return { data, loading, error, refetch: execute }
}

/**
 * useMutation — for write operations (POST/PUT/DELETE)
 * Usage: const { mutate, loading, error } = useMutation(api.createTask)
 */
export function useMutation(mutFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await mutFn(payload)
      if (res.success === false) {
        setError(res.error || 'Operation failed')
        return { success: false, error: res.error }
      }
      return { success: true, data: res.data }
    } catch (e) {
      setError(e.message)
      return { success: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [mutFn])

  return { mutate, loading, error }
}
