import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApi } from '../hooks/useApi'
import api from '../services/api'
import { Map, Plus, Loader2, X } from 'lucide-react'

const SOIL_COLORS = {
  Loamy: '#10B981', Clay: '#D97706', Sandy: '#F59E0B',
  Silty: '#38BDF8', Peaty: '#A78BFA', Chalky: '#6B7280',
}

export default function Fields() {
  const { data, loading, refetch } = useApi(() => api.getFarms())
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ farm_name: '', area: '', soil_type: 'Loamy', latitude: '', longitude: '' })

  const farms = Array.isArray(data) ? data : []

  const handleAdd = async () => {
    setSaving(true)
    // POST to create farm — using tasks endpoint as placeholder, actual create-farm endpoint
    await fetch(`${import.meta.env.VITE_EDGE_BASE_URL}/get-farms`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sfms_token')}` },
      body: JSON.stringify(form)
    })
    setSaving(false)
    setShowAdd(false)
    refetch()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin" style={{ color: '#10B981' }} />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Farms', value: farms.length, color: '#10B981' },
          { label: 'Total Acreage', value: `${farms.reduce((s, f) => s + (Number(f.area) || 0), 0).toFixed(1)} ac`, color: '#34D399' },
          { label: 'Soil Profiles', value: [...new Set(farms.map(f => f.soil_type).filter(Boolean))].length, color: '#F59E0B' },
          { label: 'Active Fields', value: farms.filter(f => f.status !== 'inactive').length, color: '#38BDF8' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4">
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: '#6B7280' }}>{farms.length} registered fields</p>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Field
        </button>
      </div>

      {/* Farm Grid */}
      {farms.length === 0 ? (
        <div className="glass-card p-10 text-center" style={{ color: '#4B5563' }}>
          No fields registered yet. Click &quot;Add Field&quot; to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {farms.map((farm, i) => {
            const soilColor = SOIL_COLORS[farm.soil_type] || '#6B7280'
            return (
              <motion.div key={farm.farm_id || i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${soilColor}18` }}>
                      <Map size={18} style={{ color: soilColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{farm.farm_name}</h3>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{farm.area} acres</p>
                    </div>
                  </div>
                  <span className="badge" style={{ background: `${soilColor}18`, color: soilColor, border: `1px solid ${soilColor}30` }}>
                    {farm.soil_type || 'Loamy'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs" style={{ color: '#9CA3AF' }}>
                  {(farm.latitude || farm.longitude) && (
                    <p>📍 {farm.latitude}, {farm.longitude}</p>
                  )}
                  {farm.crop_count > 0 && (
                    <p>🌱 {farm.crop_count} active crops</p>
                  )}
                  <p>📅 Added {farm.created_at ? new Date(farm.created_at).toLocaleDateString() : '—'}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Field Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#0F1A13', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-lg flex items-center gap-2">
                <Map size={20} style={{ color: '#10B981' }} /> Add New Field
              </h2>
              <button onClick={() => setShowAdd(false)} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                ['farm_name', 'Field Name', 'e.g. North Field'],
                ['area', 'Area (acres)', 'e.g. 5.0'],
                ['latitude', 'Latitude', 'e.g. 28.6139'],
                ['longitude', 'Longitude', 'e.g. 77.2090'],
              ].map(([key, label, ph]) => (
                <div key={key}>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={ph} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Soil Type</label>
                <select value={form.soil_type} onChange={e => setForm(f => ({ ...f, soil_type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}>
                  {Object.keys(SOIL_COLORS).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving || !form.farm_name} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add Field
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
