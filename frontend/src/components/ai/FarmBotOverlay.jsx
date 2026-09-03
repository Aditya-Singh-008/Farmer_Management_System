import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Sparkles, ListTodo, Leaf } from 'lucide-react'
import { useAI } from '../../hooks/useAI'

const presets = [
  { label: 'Predict Wheat Yield', icon: Leaf, message: 'What is the predicted yield for wheat this season?' },
  { label: 'Pest Risk Alert', icon: Sparkles, message: 'What pest risks should I watch out for right now?' },
  { label: 'Generate 7-Day Tasks', icon: ListTodo, mode: 'tasks' },
]

export default function FarmBotOverlay() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { chatHistory, sendChat, generateTasks, loading } = useAI()
  const [taskList, setTaskList] = useState([])

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    await sendChat(msg)
  }, [input, loading, sendChat])

  const handlePreset = useCallback(async (preset) => {
    if (preset.mode === 'tasks') {
      const tasks = await generateTasks()
      setTaskList(tasks)
    } else {
      await sendChat(preset.message)
    }
  }, [generateTasks, sendChat])

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #34D399, #10B981)',
          boxShadow: '0 0 20px rgba(52, 211, 153, 0.3)',
        }}
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X size={22} style={{ color: '#070D0A' }} />
              </motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Bot size={22} style={{ color: '#070D0A' }} />
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: '22rem',
              background: 'rgba(12, 24, 18, 0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              boxShadow: '0 25px 50px -10px rgba(0,0,0,0.6)',
              maxHeight: '70vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid rgba(52, 211, 153, 0.1)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}>
                <Bot size={18} style={{ color: '#070D0A' }} />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">FarmBot AI</p>
                <p className="text-xs flex items-center gap-1" style={{ color: '#6B7280' }}>
                  <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                  Online 24/7
                </p>
              </div>
            </div>

            {/* Preset Prompts */}
            <div className="flex gap-2 p-3 overflow-x-auto flex-shrink-0" style={{ borderBottom: '1px solid rgba(52, 211, 153, 0.1)' }}>
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  disabled={loading}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50"
                  style={{ color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.2)', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <p.icon size={12} />
                  {p.label}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {chatHistory.length === 0 && taskList.length === 0 && (
                <div className="text-center py-6 text-xs" style={{ color: '#4B5563' }}>
                  Ask FarmBot anything about your farm 🌱
                </div>
              )}
              {taskList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: '#34D399' }}>📋 7-Day Task Schedule</p>
                  {taskList.map((t, i) => (
                    <div key={i} className="p-2 rounded-xl text-xs"
                      style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.1)' }}>
                      <p className="font-semibold text-white">{t.title}</p>
                      <p style={{ color: '#9CA3AF' }}>{t.notes}</p>
                    </div>
                  ))}
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xs px-3 py-2 rounded-2xl text-xs leading-relaxed"
                    style={msg.role === 'user'
                      ? { background: 'linear-gradient(135deg, #34D399, #10B981)', color: '#070D0A' }
                      : { background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.1)', color: '#E5E7EB' }
                    }>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-2xl text-xs"
                    style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.1)' }}>
                    <span className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="rounded-full animate-bounce"
                          style={{ width: '6px', height: '6px', background: '#34D399', display: 'inline-block', animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3" style={{ borderTop: '1px solid rgba(52, 211, 153, 0.1)' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask FarmBot..."
                  className="flex-1 bg-transparent outline-none text-white text-xs"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #34D399, #10B981)', border: 'none', cursor: 'pointer' }}>
                  <Send size={12} style={{ color: '#070D0A' }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
