import React, { useState, useEffect } from 'react'
import { Activity, AlertTriangle, Clock, ListChecks, ShieldAlert, LogOut, Search, Filter, User as UserIcon } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const navigate = useNavigate()
  const location = useLocation()
  
  const userEmail = location.state?.userEmail || 'guest@hospital.org'
  const userInitial = userEmail.charAt(0).toUpperCase()
  
  useEffect(() => {
    fetch('http://localhost:8000/api/dashboard')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-pharmacy-600 to-pharmacy-400 p-2.5 rounded-xl shadow-md shadow-pharmacy-500/20">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">CLARITY-PHARM</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Prescription Clarification Prioritiser</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="h-8 w-px bg-gray-200"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{userEmail}</p>
              <p className="text-xs text-gray-500">Clinical Reviewer</p>
            </div>
            <div className="w-10 h-10 bg-pharmacy-100 rounded-full flex items-center justify-center text-pharmacy-700 font-bold border border-pharmacy-200">
              {userInitial}
            </div>
            <button 
              onClick={() => navigate('/')}
              className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Queue Overview</h2>
            <p className="text-gray-500 mt-1">Real-time metrics for clarification requests</p>
          </div>
          <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-lg border shadow-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
          <KpiCard title="Open Requests" value={metrics?.total_open || '-'} icon={<ListChecks className="text-blue-500" />} trend="+2 from yesterday" />
          <KpiCard title="High Priority" value={metrics?.high_priority || '-'} icon={<AlertTriangle className="text-red-500" />} highlight={true} />
          <KpiCard title="Avg Wait Time" value={`${metrics?.average_waiting_time_min || '-'}m`} icon={<Clock className="text-amber-500" />} />
          <KpiCard title="High-Risk Pending" value={metrics?.high_risk_pending || '-'} icon={<ShieldAlert className="text-purple-500" />} />
          <KpiCard title="Median Res. Time" value={`${metrics?.median_resolution_time_min || '-'}m`} icon={<Clock className="text-emerald-500" />} />
          <KpiCard title="Early Res. Rate" value={`${(metrics?.high_risk_early_resolution_rate * 100 || 0).toFixed(0)}%`} icon={<Activity className="text-pharmacy-500" />} trend="Target: 80%" />
        </div>
        
        {/* Queue Interface Mock */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Priority Queue</h3>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search ID..." className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pharmacy-500 outline-none" />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>
          </div>
          
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ListChecks className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-gray-900 font-semibold mb-2">Priority Queue is being assembled</h4>
            <p className="text-gray-500 max-w-sm mx-auto">The interactive queue table and evidence panels are currently under development. They will appear here shortly.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

function KpiCard({ title, value, icon, trend, highlight = false }: any) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col justify-between h-36 transition-all ${
      highlight 
        ? 'bg-gradient-to-br from-red-50 to-white border border-red-100 shadow-sm' 
        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
    }`}>
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-semibold text-gray-500 leading-tight">{title}</h3>
        <div className={`p-2 rounded-xl ${highlight ? 'bg-red-100' : 'bg-gray-50'}`}>{icon}</div>
      </div>
      <div>
        <div className={`text-4xl font-bold tracking-tight ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
        {trend && <div className="text-xs font-medium text-gray-400 mt-1">{trend}</div>}
      </div>
    </div>
  )
}
