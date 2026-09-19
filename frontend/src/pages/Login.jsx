import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Tractor, Eye, EyeOff, Loader2, Sprout, BarChart3, ShoppingBasket, Bot, ArrowRight, CheckCircle2 } from 'lucide-react'

const demoAccounts = [
  { label: 'Farmer Demo', email: 'helehi2643@burangir.com', password: '12345678', icon: Sprout },
  { label: 'Admin Demo',  email: 'admin@demo.com',          password: 'admin123',  icon: BarChart3 },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(form.email, form.password)
    setLoading(false)
    if (res.success) {
      navigate('/', { replace: true })
    } else {
      setError(res.error || 'Invalid credentials. Please try again.')
    }
  }

  const fillDemo = (acc) => {
    setForm({ email: acc.email, password: acc.password })
    setError('')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'radial-gradient(ellipse at top left, #0F291E 0%, #070D0A 70%)' }}>
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{ background: 'rgba(7,13,10,0.6)', borderRight: '1px solid rgba(52,211,153,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}>
            <Tractor size={20} style={{ color: '#070D0A' }} />
          </div>
          <span className="font-bold text-xl text-gradient-green">SmartFarm</span>
        </div>
        <div className="relative overflow-hidden rounded-3xl p-6" style={{ background: 'linear-gradient(145deg, rgba(52,211,153,0.12), rgba(16,185,129,0.03))', border: '1px solid rgba(52,211,153,0.16)' }}>
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', filter: 'blur(2px)' }} />
          <div className="relative flex items-center gap-2 mb-8 text-xs font-medium" style={{ color: '#6EE7B7' }}>
            <span className="pulse-dot" /> Your farm, in sync
          </div>
          <h2 className="font-bold text-4xl text-white leading-tight mb-4">
            Your farm's <br />
            <span className="text-gradient-green">intelligent hub</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
            Track crops, manage inventory, sell produce, and get AI-powered insights — all in one place.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[[Sprout, 'Crop tracking'], [BarChart3, 'AI analytics'], [ShoppingBasket, 'Marketplace'], [Bot, 'FarmBot AI']].map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-medium" style={{ color: '#D1D5DB', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.1)' }}>
                <Icon size={15} style={{ color: '#34D399' }} /> {label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: '#6B7280' }}>
          <CheckCircle2 size={15} style={{ color: '#34D399' }} /> Trusted by growing farms everywhere
        </div>
        <p className="text-xs" style={{ color: '#374151' }}>© 2026 SmartFarm Management System</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md glass-card p-8"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}>
              <Tractor size={18} style={{ color: '#070D0A' }} />
            </div>
            <span className="font-bold text-lg text-gradient-green">SmartFarm</span>
          </div>

          <div className="mb-8">
            <h1 className="font-bold text-3xl text-white mb-2">Welcome back</h1>
            <p style={{ color: '#9CA3AF' }}>Sign in to access your dashboard</p>
          </div>

          {/* Demo Account Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {demoAccounts.map(acc => (
              <button key={acc.email} onClick={() => fillDemo(acc)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#D1D5DB', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.06)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              >
                <acc.icon size={15} style={{ color: '#34D399' }} /> {acc.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs" style={{ color: '#4B5563' }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="badge-danger px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Email Address</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="farmer@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#6B7280' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium transition-colors" style={{ color: '#34D399' }}>Create account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
