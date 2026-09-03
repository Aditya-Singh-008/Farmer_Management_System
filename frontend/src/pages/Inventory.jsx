import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApi } from '../hooks/useApi'
import api from '../services/api'
import { Package, Plus, Loader2, AlertTriangle, X } from 'lucide-react'

const CATEGORY_COLORS = {
  Fertilizer: '#10B981', Seeds: '#34D399', Pesticide: '#F59E0B',
  Machinery: '#38BDF8', Tools: '#A78BFA', Other: '#6B7280',
}

export default function Inventory() {
  const { data, loading, refetch } = useApi(() => api.getInventory())
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showAdjust, setShowAdjust] = useState(null)
  const [form, setForm] = useState({ name: '', category: 'Seeds', quantity: '', unit: 'kg' })
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustType, setAdjustType] = useState('add')
  const [saving, setSaving] = useState(false)

  const items = Array.isArray(data) ? data : []
  const filtered = items.filter(i =>
    (i.inputs?.name || i.name || '').toLowerCase().includes(search.toLowerCase())
  )
  const lowStock = items.filter(i => (i.quantity || 0) < 10).length

  const handleAdjust = async () => {
    if (!showAdjust || !adjustQty) return
    setSaving(true)
    await api.adjustInventory({ inventory_id: showAdjust.inventory_id, adjustment_type: adjustType, quantity: Number(adjustQty) })
    setSaving(false)
    setShowAdjust(null)
    setAdjustQty('')
    refetch()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin" style={{ color: '#10B981' }} />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3">
          <div className="glass-card px-4 py-3 flex items-center gap-2">
            <Package size={16} style={{ color: '#10B981' }} />
            <span className="text-white font-semibold">{items.length}</span>
            <span className="text-xs" style={{ color: '#6B7280' }}>Total Items</span>
          </div>
          {lowStock > 0 && (
            <div className="glass-card px-4 py-3 flex items-center gap-2"
              style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
              <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
              <span style={{ color: '#F59E0B' }} className="font-semibold">{lowStock}</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>Low Stock</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="px-3 py-2 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '200px' }} />
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Item Name', 'Category', 'Quantity', 'Unit', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: '#4B5563' }}>
                  No inventory items found.
                </td></tr>
              ) : filtered.map((item, i) => {
                const name = item.inputs?.name || item.name || 'Unknown'
                const cat = item.inputs?.category || item.category || 'Other'
                const qty = item.quantity ?? 0
                const catColor = CATEGORY_COLORS[cat] || '#6B7280'
                const isLow = qty < 10
                return (
                  <motion.tr key={item.inventory_id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3 font-medium text-white">{name}</td>
                    <td className="px-5 py-3">
                      <span className="badge" style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}>{cat}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold" style={{ color: isLow ? '#F59E0B' : '#E5E7EB' }}>{qty}</td>
                    <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{item.unit || 'units'}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${isLow ? 'badge-warning' : 'badge-success'}`}>
                        {isLow ? '⚠ Low Stock' : '✓ In Stock'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => setShowAdjust(item)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{ background: 'rgba(52,211,153,0.08)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                        Adjust
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#0F1A13', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Adjust Stock</h3>
              <button onClick={() => setShowAdjust(null)} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>
              {showAdjust.inputs?.name || showAdjust.name} — Current: <strong className="text-white">{showAdjust.quantity} {showAdjust.unit}</strong>
            </p>
            <div className="flex gap-2 mb-3">
              {['add', 'subtract', 'set'].map(t => (
                <button key={t} onClick={() => setAdjustType(t)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all"
                  style={adjustType === t
                    ? { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)' }
                  }>{t}</button>
              ))}
            </div>
            <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
              placeholder="Quantity" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button onClick={handleAdjust} disabled={saving || !adjustQty} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Confirm Adjustment
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
