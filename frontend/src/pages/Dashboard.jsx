import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import api from '../services/api'
import { motion } from 'framer-motion'
import { Sprout, Map, Package, TrendingUp, CheckSquare, AlertCircle, Loader2 } from 'lucide-react'

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <motion.div
    className="glass-card p-5 flex items-center gap-4"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}20` }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{label}</p>
    </div>
  </motion.div>
)

const stageColors = {
  planted: '#38BDF8',
  growing: '#10B981',
  flowering: '#F59E0B',
  'harvest ready': '#34D399',
  harvested: '#6B7280',
}

export default function Dashboard() {
  const { data, loading, error } = useApi(() => api.getDashboard(5))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: '#10B981' }} />
      </div>
    )
  }

  const metrics = data?.metrics || {}
  const crops = data?.recent_crops || []
  const tasks = data?.recent_tasks || []

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm badge-danger">
          <AlertCircle size={16} />
          <span>{error} — showing offline data</span>
        </div>
      )}

      {/* Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Map}        label="Active Farms"  value={metrics.total_farms     ?? 0} color="#10B981" />
        <MetricCard icon={Sprout}     label="Active Crops"  value={metrics.total_crops     ?? 0} color="#34D399" />
        <MetricCard icon={Package}    label="Stock Items"   value={metrics.total_inventory ?? 0} color="#38BDF8" />
        <MetricCard icon={TrendingUp} label="Live Listings" value={metrics.active_listings ?? 0} color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Crops */}
        <div className="glass-card p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Sprout size={18} style={{ color: '#10B981' }} />
            Current Crops
          </h2>
          {crops.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#4B5563' }}>
              No crops registered yet.
            </p>
          ) : (
            <div className="space-y-3">
              {crops.map((crop, i) => {
                const stage = crop.status?.toLowerCase() || 'planted'
                const color = stageColors[stage] || '#6B7280'
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p className="font-medium text-white text-sm">{crop.crop_name}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        {crop.farm_name || 'Farm'} · {crop.area} acres
                      </p>
                    </div>
                    <span className="badge"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
                      {crop.status}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="glass-card p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <CheckSquare size={18} style={{ color: '#F59E0B' }} />
            Upcoming Tasks
          </h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#4B5563' }}>
              No tasks scheduled. Use FarmBot AI to generate tasks!
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: task.status === 'completed' ? '#10B981' : '#F59E0B' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{task.title}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                  <span className={`badge ${task.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                    {task.priority || 'medium'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
