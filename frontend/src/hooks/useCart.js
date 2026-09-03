import { useState, useCallback } from 'react'

export function useCart() {
  const [items, setItems] = useState([])

  const addItem = useCallback((listing) => {
    setItems(prev => {
      const existing = prev.find(i => i.listing_id === listing.listing_id)
      if (existing) {
        return prev.map(i =>
          i.listing_id === listing.listing_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...listing, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((listing_id) => {
    setItems(prev => prev.filter(i => i.listing_id !== listing_id))
  }, [])

  const updateQuantity = useCallback((listing_id, quantity) => {
    if (quantity <= 0) {
      removeItem(listing_id)
      return
    }
    setItems(prev => prev.map(i =>
      i.listing_id === listing_id ? { ...i, quantity } : i
    ))
  }, [removeItem])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + (i.price_per_unit || 0) * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, total, count }
}
