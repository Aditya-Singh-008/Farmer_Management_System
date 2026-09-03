import { useState, useCallback } from 'react'
import api from '../services/api'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chatHistory, setChatHistory] = useState([])

  const sendChat = useCallback(async (message) => {
    setLoading(true)
    setError(null)
    const historyToSend = chatHistory.slice(-6).map(h => ({
      role: h.role,
      content: h.content
    }))
    try {
      const res = await api.aiChat({ mode: 'chat', message, history: historyToSend })
      if (res.success) {
        const newHistory = [
          ...chatHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: res.data.response }
        ]
        setChatHistory(newHistory)
        return res.data.response
      } else {
        setError(res.error || 'AI error')
        return null
      }
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [chatHistory])

  const generateTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.aiChat({ mode: 'tasks' })
      return res.success ? res.data?.tasks || [] : []
    } catch (e) {
      setError(e.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const autofillCrop = useCallback(async (crop_name) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.aiChat({ mode: 'autofill', crop_name })
      return res.success ? res.data : null
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const predictYield = useCallback(async (cropData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.aiYield(cropData)
      return res.success ? res.data : null
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const checkInventory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.aiInventoryCheck()
      return res.success ? res.data : null
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clearHistory = useCallback(() => setChatHistory([]), [])

  return {
    loading,
    error,
    chatHistory,
    sendChat,
    generateTasks,
    autofillCrop,
    predictYield,
    checkInventory,
    clearHistory,
  }
}
