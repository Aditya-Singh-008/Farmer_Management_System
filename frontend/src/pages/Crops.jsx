import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApi, useMutation } from '../hooks/useApi'
import { useAI } from '../hooks/useAI'
import api from '../services/api'
import { Sprout, Plus, Loader2, Sparkles, X } from 'lucide-react'

const STATUS_COLORS = {
  planted: '#38BDF8', growing: '#10B981', flowering: '#F59E0B',
  'harvest ready': '#34D399', harvested: '#6B7280',
}
const FILTER_TABS = ['All', 'Planted', 'Growing', 'Flowering', 'Harvest Ready', 'Harvested']

export default function Crops() {
  const { data, loading, refetch } = useApi(() => api.getCrops())
  const { mutate: createCrop, loading: creating } = useMutation((p) => api.createTask(p))
  const { autofillCrop, loading: aiLoading } = useAI()

  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ crop_name: '', crop_type: '', area: '', sowing_date: '', expected_harvest: '', notes: '' })

  const crops = Array.isArray(data) ? data : []
  const filtered = filter === 'All' ? crops : crops.filter(c => c.status?.toLowerCase() === filter.toLowerCase())

  const handleAutofill = async () => {
    if (!form.crop_name) return
    const defaults = await autofillCrop(form.crop_name)
    if (defaults) {
      setForm(f => ({ ...f, crop_type: defaults.crop_type || f.crop_type, notes: defaults.notes || f.notes }))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin" style={{ color: '#10B981' }} />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: '#6B7280' }}>{crops.length} crops total · {crops.filter(c => c.status === 'harvest ready').length} ready for harvest</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Crop
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={filter === tab
              ? { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)' }
            }>
            {tab}
          </button>
        ))}
      </div>

      {/* Crop Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center" style={{ color: '#4B5563' }}>
          No crops found. Click &quot;Add Crop&quot; to register your first crop.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((crop, i) => {
            const color = STATUS_COLORS[crop.status?.toLowerCase()] || '#6B7280'
            const isSelected = selected?.crop_id === crop.crop_id
            return (
              <motion.div key={crop.crop_id || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(isSelected ? null : crop)}
                className="glass-card p-5 cursor-pointer"
                style={isSelected ? { borderColor: '#34D399', boxShadow: '0 0 20px rgba(52,211,153,0.15)' } : {}}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{crop.crop_name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{crop.farm_name || 'Farm'} · {crop.area} acres</p>
                  </div>
                  <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                    {crop.status || 'planted'}
                  </span>
                </div>
                <div className="space-y-1 text-xs" style={{ color: '#9CA3AF' }}>
                  {crop.sowing_date && <p>🌱 Sown: {new Date(crop.sowing_date).toLocaleDateString()}</p>}
                  {crop.expected_harvest && <p>🌾 Harvest: {new Date(crop.expected_harvest).toLocaleDateString()}</p>}
                  {crop.crop_type && <p>🏷️ Type: {crop.crop_type}</p>}
                </div>
                {isSelected && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {crop.notes && <p className="text-xs" style={{ color: '#9CA3AF' }}>{crop.notes}</p>}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Crop Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ background: '#0F1A13', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-lg flex items-center gap-2">
                <Sprout size={20} style={{ color: '#10B981' }} /> Add New Crop
              </h2>
              <button onClick={() => setShowAdd(false)} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Crop Name *</label>
                  <input value={form.crop_name} onChange={e => setForm(f => ({ ...f, crop_name: e.target.value }))}
                    placeholder="e.g. Wheat" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex items-end">
                  <button onClick={handleAutofill} disabled={aiLoading || !form.crop_name}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                    style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI Fill
                  </button>
                </div>
              </div>

              {[
                ['crop_type', 'Crop Type', 'e.g. Cereal'],
                ['area', 'Area (acres)', 'e.g. 2.5'],
                ['sowing_date', 'Sowing Date', '', 'date'],
                ['expected_harvest', 'Expected Harvest', '', 'date'],
              ].map(([key, label, ph, type = 'text']) => (
                <div key={key}>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>{label}</label>
                  <input type={type} value={form[key]} placeholder={ph}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
                </div>
              ))}

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Optional notes..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
              <button disabled={creating || !form.crop_name} className="btn-primary flex-1 flex items-center justify-center gap-2"
                onClick={async () => {
                  const res = await createCrop(form)
                  if (res.success) { setShowAdd(false); refetch() }
                }}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add Crop
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
