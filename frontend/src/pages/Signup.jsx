import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Tractor, Eye, EyeOff, Loader2, Check } from 'lucide-react'

function strengthScore(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[a-z]/.test(pw)) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  return s
}

const levels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
const colors = ['', '#ef4444', '#f97316', '#eab308', '#10b981', '#34d399']

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  const score = strengthScore(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (!agreed) { setError('Please agree to the terms'); return }
    setLoading(true)
    const res = await signup(form.first_name, form.last_name, form.email, form.password)
    setLoading(false)
    if (res.success) {
      navigate('/', { replace: true })
    } else {
      setError(res.error || 'Signup failed. Please try again.')
    }
  }

  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse at top, #0F291E 0%, #070D0A 70%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}>
            <Tractor size={20} style={{ color: '#070D0A' }} />
          </div>
          <span className="font-bold text-xl text-gradient-green">SmartFarm</span>
        </div>

        <div className="mb-6">
          <h1 className="font-bold text-2xl text-white mb-1">Create your account</h1>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Start managing your farm intelligently</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="badge-danger px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            {[['first_name', 'First Name', 'Aditya'], ['last_name', 'Last Name', 'Singh']].map(([key, label, ph]) => (
              <div key={key}>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>{label}</label>
                <input type="text" required placeholder={ph} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Email Address</label>
            <input type="email" required placeholder="farmer@example.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none" style={inputStyle} />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required placeholder="Min 8 characters"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: i <= score ? colors[score] : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <p className="text-xs" style={{ color: colors[score] }}>{levels[score]}</p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Confirm Password</label>
            <div className="relative">
              <input type="password" required placeholder="Repeat password"
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              {form.confirm && form.confirm === form.password && (
                <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#10B981' }} />
              )}
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded" style={{ accentColor: '#10B981' }} />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              I agree to the <span style={{ color: '#34D399' }}>Terms of Service</span>
            </span>
          </label>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium" style={{ color: '#34D399' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
