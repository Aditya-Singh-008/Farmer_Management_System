import { useAuth } from '../../context/AuthContext'
import { Bell, Search } from 'lucide-react'
import { useState } from 'react'

const greetingText = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Navbar({ title }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3"
      style={{
        background: 'rgba(7, 13, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(52, 211, 153, 0.08)',
      }}>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-white truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h1>
        <p className="text-xs" style={{ color: '#6B7280' }}>
          {greetingText()}, {user?.first_name || 'Farmer'} 👋
        </p>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-56"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Search size={14} style={{ color: '#6B7280' }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search..."
          className="bg-transparent outline-none w-full text-sm text-white"
          style={{ '::placeholder': { color: '#4B5563' } }}
        />
      </div>

      {/* Notifications */}
      <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>
        <Bell size={16} />
        <span className="absolute top-1.5 right-1.5 pulse-dot" style={{ width: '8px', height: '8px' }} />
      </button>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #34D399, #10B981)', color: '#070D0A' }}>
        {(user?.first_name?.[0] || 'F').toUpperCase()}
      </div>
    </header>
  )
}
