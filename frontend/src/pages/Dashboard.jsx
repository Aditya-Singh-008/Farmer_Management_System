import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle, ArrowUpRight, Check, CheckSquare, CloudRain, Droplets,
  Leaf, Loader2, Map, Package, Plus, Sprout, Thermometer, TrendingUp, Wind,
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import api from '../services/api'

const stageColors = {
  planted: '#38BDF8', growing: '#10B981', flowering: '#F59E0B',
  'harvest ready': '#34D399', harvested: '#94A3B8',
}

const weather = [
  { label: 'Soil moisture', value: '68%', status: 'Optimal', icon: Droplets, color: '#38BDF8' },
  { label: 'Air temperature', value: '24°C', status: 'Ideal', icon: Thermometer, color: '#F59E0B' },
  { label: 'Wind speed', value: '12 km/h', status: 'Calm', icon: Wind, color: '#A78BFA' },
  { label: 'Rain probability', value: '18%', status: 'Low', icon: CloudRain, color: '#60A5FA' },
]

const MetricCard = ({ icon: Icon, label, value, delta, color }) => (
  <motion.div className="glass-card metric-card" whileHover={{ y: -4 }}>
    <div className="metric-icon" style={{ background: `${color}18`, boxShadow: `0 0 24px ${color}18` }}>
      <Icon size={21} style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: '#718078' }}>{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
        <span className="text-[11px] font-semibold" style={{ color: '#34D399' }}>{delta}</span>
      </div>
    </div>
  </motion.div>
)

function CropProgress({ crop, index }) {
  const stage = crop.status?.toLowerCase() || 'growing'
  const color = stageColors[stage] || '#34D399'
  const progress = Math.min(92, 38 + index * 17)
  return (
    <motion.div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}><Leaf size={18} style={{ color }} /></div>
          <div className="min-w-0"><p className="font-semibold text-white truncate">{crop.crop_name || 'Crop plot'}</p><p className="text-xs mt-0.5 truncate" style={{ color: '#718078' }}>{crop.farm_name || 'North Field'} · {crop.area || 12} acres</p></div>
        </div>
        <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}45` }}>{crop.status || 'Growing'}</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs"><span style={{ color: '#718078' }}>Yield projection</span><span className="font-semibold text-white">{progress}%</span></div>
      <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}><motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}, #34D399)` }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: index * 0.08 }} /></div>
      <p className="mt-2 text-[11px]" style={{ color: '#718078' }}>{Math.max(8, 31 - index * 7)} days until harvest window</p>
    </motion.div>
  )
}

export default function Dashboard() {
  const { data, loading, error } = useApi(() => api.getDashboard(6))
  const [completedTasks, setCompletedTasks] = useState([])
  const metrics = data?.metrics || {}
  const crops = data?.recent_crops || []
  const tasks = data?.recent_tasks || []
  const visibleCrops = crops.length ? crops.slice(0, 4) : [{ crop_name: 'Wheat', status: 'Growing', farm_name: 'North Field', area: 24 }, { crop_name: 'Tomatoes', status: 'Flowering', farm_name: 'Greenhouse A', area: 8 }]
  const visibleTasks = tasks.length ? tasks.slice(0, 4) : [{ title: 'Inspect irrigation lines', priority: 'high', due_date: 'Today' }, { title: 'Apply organic fertilizer', priority: 'medium', due_date: 'Tomorrow' }, { title: 'Review crop health report', priority: 'low', due_date: 'Sep 22' }]

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 size={30} className="animate-spin" style={{ color: '#10B981' }} /></div>

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#34D399' }}><span className="pulse-dot" /> Live farm conditions</div><h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Farm at a glance</h2><p className="mt-1 text-sm" style={{ color: '#718078' }}>Your operation is running smoothly today.</p></div>
        <button className="btn-primary inline-flex items-center justify-center gap-2 self-start"><Plus size={16} /> Add activity</button>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{weather.map(({ label, value, status, icon: Icon, color }) => <div key={label} className="glass-card flex items-center gap-3 px-4 py-3"><Icon size={18} style={{ color }} /><div className="min-w-0"><p className="truncate text-[11px]" style={{ color: '#718078' }}>{label}</p><div className="flex items-center gap-2"><strong className="text-sm text-white">{value}</strong><span className="hidden text-[10px] font-semibold sm:inline" style={{ color }}>{status}</span></div></div></div>)}</div>

      {error && <div className="flex items-center gap-2 rounded-xl p-3 text-sm badge-warning"><AlertCircle size={16} /><span>{error} — showing recent offline data</span></div>}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard icon={Map} label="Active farms" value={metrics.total_farms ?? 3} delta="+1 this month" color="#10B981" />
        <MetricCard icon={Sprout} label="Active crops" value={metrics.total_crops ?? 12} delta="+18.2%" color="#34D399" />
        <MetricCard icon={Package} label="Stock items" value={metrics.total_inventory ?? 48} delta="Healthy" color="#38BDF8" />
        <MetricCard icon={TrendingUp} label="Live listings" value={metrics.active_listings ?? 7} delta="+3 today" color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="glass-card p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.14em]" style={{ color: '#718078' }}>Production overview</p><h3 className="mt-1 text-lg font-bold text-white">Current crops</h3></div><button className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#34D399' }}>View all <ArrowUpRight size={14} /></button></div><div className="grid gap-3 md:grid-cols-2">{visibleCrops.map((crop, index) => <CropProgress key={`${crop.crop_name}-${index}`} crop={crop} index={index} />)}</div></section>
        <section className="glass-card p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.14em]" style={{ color: '#718078' }}>Your schedule</p><h3 className="mt-1 text-lg font-bold text-white">Upcoming tasks</h3></div><button className="text-xs font-semibold" style={{ color: '#34D399' }}>Manage</button></div><div className="flex flex-col gap-3">{visibleTasks.map((task, index) => { const done = completedTasks.includes(index); return <div key={`${task.title}-${index}`} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}><button aria-label={done ? 'Mark task incomplete' : 'Mark task complete'} onClick={() => setCompletedTasks(value => done ? value.filter(item => item !== index) : [...value, index])} className="flex size-8 shrink-0 items-center justify-center rounded-xl" style={{ background: done ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.06)', color: done ? '#34D399' : '#718078' }}>{done ? <Check size={15} /> : <CheckSquare size={15} />}</button><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${done ? 'line-through' : 'text-white'}`} style={done ? { color: '#718078' } : undefined}>{task.title}</p><p className="mt-0.5 text-xs" style={{ color: '#718078' }}>{task.due_date ? (task.due_date === 'Today' || task.due_date === 'Tomorrow' ? task.due_date : new Date(task.due_date).toLocaleDateString()) : 'No due date'}</p></div><span className={`badge ${task.priority === 'high' ? 'badge-danger' : task.priority === 'low' ? 'badge-success' : 'badge-warning'}`}>{task.priority || 'medium'}</span></div> })}</div></section>
      </div>

      <section className="glass-card overflow-hidden p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.14em]" style={{ color: '#718078' }}>Season performance</p><h3 className="mt-1 text-lg font-bold text-white">Yield & revenue trend</h3></div><div className="flex items-center gap-3 text-xs" style={{ color: '#718078' }}><span className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ background: '#34D399' }} />Revenue</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ background: '#38BDF8' }} />Yield</span></div></div><div className="flex h-36 items-end gap-2 sm:gap-4">{[42, 58, 48, 72, 65, 84, 78, 96, 88, 100, 92, 100].map((height, index) => <div key={index} className="group flex flex-1 flex-col items-center gap-2"><div className="relative flex h-full w-full items-end gap-1"><div className="w-1/2 rounded-t-md transition-all group-hover:brightness-125" style={{ height: `${height * 0.72}%`, background: 'linear-gradient(180deg, #34D399, rgba(16,185,129,0.2))' }} /><div className="w-1/2 rounded-t-md transition-all group-hover:brightness-125" style={{ height: `${height * 0.5}%`, background: 'linear-gradient(180deg, #38BDF8, rgba(56,189,248,0.16))' }} /></div><span className="text-[10px]" style={{ color: '#52635A' }}>{['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'][index]}</span></div>)}</div></section>
    </div>
  )
}
