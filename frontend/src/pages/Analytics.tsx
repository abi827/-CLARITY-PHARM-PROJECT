import { useEffect, useState } from 'react'
import { analyticsAPI } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7', '#eab308', '#06b6d4', '#ec4899', '#84cc16']
const PRIORITY_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

export default function Analytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.get().then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading analytics…</div>
  if (!data) return <div className="text-center py-20 text-red-500">Failed to load analytics.</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500">Calculated from clarification data</p>
      </div>

      {/* Override summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Reviews" value={data.total_reviews} color="blue" />
        <StatCard title="Total Overrides" value={data.total_overrides} color="orange" />
        <StatCard title="Override Rate" value={`${(data.override_rate * 100).toFixed(1)}%`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Requests by Department">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.by_department}>
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.by_department.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Requests by Medicine Risk">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.by_risk} dataKey="count" nameKey="risk" cx="50%" cy="50%" outerRadius={70} label={(props: any) => `${props.risk || props.name}: ${props.count || props.value}`}>
                {data.by_risk.map((_: any, i: number) => <Cell key={i} fill={['#22c55e', '#eab308', '#ef4444'][i % 3]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Priority Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.by_priority}>
              <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.by_priority.map((d: any) => <Cell key={d.priority} fill={PRIORITY_COLORS[d.priority] || '#94a3b8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Clarification Types">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.by_type} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.by_type.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: any) {
  const c = color === 'blue' ? 'border-blue-100 bg-blue-50 text-blue-700' : color === 'orange' ? 'border-orange-100 bg-orange-50 text-orange-700' : 'border-purple-100 bg-purple-50 text-purple-700'
  return (
    <div className={`rounded-2xl border p-5 ${c}`}>
      <p className="text-sm font-semibold opacity-80">{title}</p>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}
