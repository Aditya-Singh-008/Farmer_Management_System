import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApi } from '../hooks/useApi'
import { useCart } from '../hooks/useCart'
import api from '../services/api'
import { ShoppingBag, ShoppingCart, X, Loader2, Plus, Tag } from 'lucide-react'

export default function Marketplace() {
  const { data, loading } = useApi(() => api.getListings())
  const { items: cartItems, addItem, removeItem, updateQuantity, clearCart, total, count } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [placing, setPlacing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const listings = Array.isArray(data) ? data : []
  const filtered = filter
    ? listings.filter(l => (l.crop_name || '').toLowerCase().includes(filter.toLowerCase()))
    : listings

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return
    setPlacing(true)
    for (const item of cartItems) {
      await api.createOrder({ listing_id: item.listing_id, quantity: item.quantity })
    }
    setPlacing(false)
    clearCart()
    setCartOpen(false)
    setOrderSuccess(true)
    setTimeout(() => setOrderSuccess(false), 4000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin" style={{ color: '#10B981' }} />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="text-sm" style={{ color: '#6B7280' }}>{listings.length} active listings</p>
        </div>
        <div className="flex gap-2">
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter by crop..."
            className="px-3 py-2 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '180px' }} />
          <button onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.25)' }}>
            <ShoppingCart size={16} />
            Cart
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: '#10B981', color: '#070D0A' }}>{count}</span>
            )}
          </button>
        </div>
      </div>

      {orderSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="badge-success px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          ✅ Order placed successfully! The seller will contact you soon.
        </motion.div>
      )}

      {/* Listings Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center" style={{ color: '#4B5563' }}>
          No marketplace listings available.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((listing, i) => {
            const inCart = cartItems.find(c => c.listing_id === listing.listing_id)
            return (
              <motion.div key={listing.listing_id || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-5 flex flex-col gap-3"
              >
                {/* Crop image placeholder */}
                <div className="w-full h-28 rounded-xl flex items-center justify-center text-4xl"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.05))' }}>
                  🌾
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{listing.crop_name || 'Produce'}</h3>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                      {listing.farm_name || 'Local Farm'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: '#34D399' }}>
                      ₹{listing.price_per_unit || listing.price || '—'}
                      <span className="text-xs font-normal" style={{ color: '#6B7280' }}>/kg</span>
                    </p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      {listing.available_qty || listing.quantity || 0} kg available
                    </p>
                  </div>
                </div>

                {listing.harvest_date && (
                  <p className="text-xs flex items-center gap-1" style={{ color: '#9CA3AF' }}>
                    <Tag size={10} /> Harvested: {new Date(listing.harvest_date).toLocaleDateString()}
                  </p>
                )}

                <button
                  onClick={() => inCart ? removeItem(listing.listing_id) : addItem(listing)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all"
                  style={inCart
                    ? { background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }
                    : { background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }
                  }>
                  {inCart ? <><X size={14} /> Remove</> : <><Plus size={14} /> Add to Cart</>}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setCartOpen(false)}>
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="h-full flex flex-col w-80"
            style={{ background: '#0F1A13', borderLeft: '1px solid rgba(52,211,153,0.15)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShoppingCart size={18} style={{ color: '#10B981' }} /> Cart ({count})
              </h3>
              <button onClick={() => setCartOpen(false)} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: '#4B5563' }}>Your cart is empty</p>
              ) : cartItems.map(item => (
                <div key={item.listing_id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex justify-between mb-2">
                    <p className="font-medium text-white text-sm">{item.crop_name || 'Produce'}</p>
                    <button onClick={() => removeItem(item.listing_id)} style={{ color: '#6B7280' }}><X size={14} /></button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.listing_id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>−</button>
                      <span className="text-sm text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.listing_id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>+</button>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#34D399' }}>
                      ₹{((item.price_per_unit || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between mb-4">
                  <span style={{ color: '#9CA3AF' }}>Total</span>
                  <span className="font-bold text-white">₹{total.toFixed(2)}</span>
                </div>
                <button onClick={handlePlaceOrder} disabled={placing} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {placing ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                  {placing ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
