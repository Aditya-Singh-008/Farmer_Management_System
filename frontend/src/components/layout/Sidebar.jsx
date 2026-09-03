import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Sprout, Map, Package, ShoppingBag,
  BarChart2, LogOut, Tractor, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/crops', label: 'Crops', icon: Sprout },
  { to: '/fields', label: 'Fields', icon: Map },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
      style={{
        background: 'rgba(7, 13, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(52, 211, 153, 0.1)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid rgba(52, 211, 153, 0.1)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}>
          <Tractor size={18} style={{ color: '#070D0A' }} />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-gradient-green">SmartFarm</span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto transition-colors"
          style={{ color: '#6B7280' }}
          onMouseEnter={e => e.target.style.color = '#34D399'}
          onMouseLeave={e => e.target.style.color = '#6B7280'}
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="block"
          >
            {({ isActive }) => (
              <div
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={isActive
                  ? { background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }
                  : { color: '#9CA3AF', border: '1px solid transparent' }
                }
              >
                {isActive && (
                  <span className="absolute left-0 w-1 h-6 rounded-r-full" style={{ background: '#10B981' }} />
                )}
                <Icon size={18} style={{ flexShrink: 0, color: isActive ? '#34D399' : 'inherit' }} />
                {!collapsed && <span>{label}</span>}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(52, 211, 153, 0.1)' }}>
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #34D399, #10B981)', color: '#070D0A' }}>
              {(user.first_name?.[0] || user.email?.[0] || 'F').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.first_name || 'Farmer'}</p>
              <p className="text-xs truncate" style={{ color: '#6B7280' }}>{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
