import { useEffect, useState } from 'react'
import { dashAPI } from '../services/api'
import { Activity, AlertTriangle, Clock, ListChecks, ShieldAlert, TrendingUp, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useNavigate } from 'react-router-dom'

const PRIORITY_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    dashAPI.get().then(r => { setMetrics(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const dist = metrics?.priority_distribution || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Queue Overview</h2>
          <p className="text-gray-500 mt-1">Real-time metrics for clarification requests</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Open Requests" value={loading ? '…' : metrics?.total_open} icon={<ListChecks className="text-blue-500 w-5 h-5" />} />
        <KpiCard title="High Priority" value={loading ? '…' : metrics?.high_priority} icon={<AlertTriangle className="text-red-500 w-5 h-5" />} highlight />
        <KpiCard title="Avg Wait" value={loading ? '…' : `${metrics?.average_waiting_time_min ?? 0}m`} icon={<Clock className="text-amber-500 w-5 h-5" />} />
        <KpiCard title="High-Risk Pending" value={loading ? '…' : metrics?.high_risk_pending} icon={<ShieldAlert className="text-purple-500 w-5 h-5" />} />
        <KpiCard title="Median Res. Time" value={loading ? '…' : `${metrics?.median_resolution_time_min ?? 0}m`} icon={<Clock className="text-emerald-500 w-5 h-5" />} />
        <KpiCard
          title="Early Res. Rate"
          value={loading ? '…' : `${((metrics?.high_risk_early_resolution_rate ?? 0) * 100).toFixed(0)}%`}
          icon={<Activity className="text-green-500 w-5 h-5" />}
          sub={`Target: ${((metrics?.target_early_resolution_rate ?? 0.8) * 100).toFixed(0)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Priority Distribution</h3>
          {dist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dist} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={80} label={(props: any) => `${props.level || props.name}: ${props.count || props.value}`}>
                  {dist.map((d: any) => <Cell key={d.level} fill={PRIORITY_COLORS[d.level] || '#94a3b8'} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={() => navigate('/priority-queue')}
              className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors text-left">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Review Priority Queue</p>
                <p className="text-xs text-gray-500">Check CRITICAL and HIGH requests</p>
              </div>
            </button>
            <button onClick={() => navigate('/analytics')}
              className="w-full flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors text-left">
              <TrendingUp className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Performance Analytics</p>
                <p className="text-xs text-gray-500">Review resolution metrics & trends</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon, highlight = false, sub }: any) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col justify-between h-32 border shadow-sm transition-all ${highlight ? 'bg-gradient-to-br from-red-50 to-white border-red-100' : 'bg-white border-gray-200 hover:shadow-md'}`}>
      <div className="flex justify-between items-start">
        <h3 className="text-xs font-semibold text-gray-500 leading-tight">{title}</h3>
        <div className={`p-1.5 rounded-lg ${highlight ? 'bg-red-100' : 'bg-gray-50'}`}>{icon}</div>
      </div>
      <div>
        <div className={`text-3xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
