import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, TrendingDown, Download } from 'lucide-react'

const MONTH_DATA = [
  { month: 'Mar', volume: 12.4, price: 2200, revenue: 27280, margin: 18 },
  { month: 'Apr', volume: 18.1, price: 2450, revenue: 44345, margin: 22 },
  { month: 'May', volume: 14.6, price: 2100, revenue: 30660, margin: 15 },
  { month: 'Jun', volume: 22.3, price: 2800, revenue: 62440, margin: 28 },
  { month: 'Jul', volume: 19.8, price: 2600, revenue: 51480, margin: 24 },
  { month: 'Aug', volume: 25.5, price: 3100, revenue: 79050, margin: 31 },
]

const maxRevenue = Math.max(...MONTH_DATA.map(d => d.revenue))

export default function Reports() {
  const totalRevenue = MONTH_DATA.reduce((s, d) => s + d.revenue, 0)
  const avgMargin = (MONTH_DATA.reduce((s, d) => s + d.margin, 0) / MONTH_DATA.length).toFixed(1)
  const lastMonth = MONTH_DATA[MONTH_DATA.length - 1]
  const prevMonth = MONTH_DATA[MONTH_DATA.length - 2]
  const revenueChange = (((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, color: '#10B981', icon: TrendingUp },
          { label: 'Avg Profit Margin', value: `${avgMargin}%`, color: '#34D399', icon: BarChart2 },
          { label: 'Last Month Revenue', value: `₹${(lastMonth.revenue / 1000).toFixed(1)}K`, color: '#38BDF8', icon: TrendingUp },
          { label: 'MoM Change', value: `${revenueChange > 0 ? '+' : ''}${revenueChange}%`, color: revenueChange > 0 ? '#10B981' : '#F87171', icon: revenueChange > 0 ? TrendingUp : TrendingDown },
        ].map(({ label, value, color, icon: Icon }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-white flex items-center gap-2">
            <BarChart2 size={18} style={{ color: '#10B981' }} /> Revenue Trends
          </h2>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(52,211,153,0.08)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
            <Download size={12} /> Export CSV
          </button>
        </div>

        {/* Custom Bar Chart */}
        <div className="flex items-end gap-3 h-48">
          {MONTH_DATA.map((d, i) => {
            const height = `${(d.revenue / maxRevenue) * 100}%`
            return (
              <motion.div key={d.month} className="flex-1 flex flex-col items-center gap-2"
                initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                style={{ transformOrigin: 'bottom' }}>
                <div className="w-full rounded-t-xl relative group cursor-pointer"
                  style={{
                    height: height,
                    background: i === MONTH_DATA.length - 1
                      ? 'linear-gradient(180deg, #34D399, #10B981)'
                      : 'linear-gradient(180deg, rgba(52,211,153,0.4), rgba(16,185,129,0.2))',
                    minHeight: '20px',
                    transition: 'background 0.2s',
                  }}>
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: '#0F1A13', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>
                    ₹{(d.revenue / 1000).toFixed(1)}K
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#6B7280' }}>{d.month}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-white">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Month', 'Volume (tons)', 'Avg Price/kg', 'Revenue', 'Net Margin'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTH_DATA.map((d, i) => (
                <motion.tr key={d.month}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-3 font-semibold text-white">{d.month} 2026</td>
                  <td className="px-5 py-3" style={{ color: '#E5E7EB' }}>{d.volume}</td>
                  <td className="px-5 py-3" style={{ color: '#E5E7EB' }}>₹{d.price}</td>
                  <td className="px-5 py-3 font-semibold" style={{ color: '#34D399' }}>₹{d.revenue.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${d.margin >= 25 ? 'badge-success' : 'badge-warning'}`}>
                      {d.margin}%
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
