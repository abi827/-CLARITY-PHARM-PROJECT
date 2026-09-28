import React, { useEffect, useState } from 'react'
import { clarAPI, pharmacyRxAPI } from '../services/api'
import { Search, Filter, Eye, AlertTriangle, Clock, ShieldAlert, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import ClarificationDetail from './ClarificationDetail'

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴' },
  HIGH:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🟠' },
  MEDIUM:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: '🟡' },
  LOW:      { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '🟢' },
}

function PriorityBadge({ level }: { level: string }) {
  const cfg = PRIORITY_CONFIG[level] || PRIORITY_CONFIG.LOW
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon} {level}
    </span>
  )
}

function RiskBadge({ risk }: { risk: string }) {
  const c = risk === 'High' ? 'bg-red-100 text-red-700' : risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c}`}>{risk}</span>
}

export default function PriorityQueue() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [risk, setRisk] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')
  const [highRiskOnly, setHighRiskOnly] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  const [rxData, setRxData] = useState<any[]>([])
  const [viewTab, setViewTab] = useState<'clarifications' | 'prescriptions'>('clarifications')

  const load = () => {
    setLoading(true)
    if (viewTab === 'clarifications') {
      const params: any = {}
      if (dept) params.department = dept
      if (risk) params.medicine_risk = risk
      if (priority) params.priority = priority
      if (status) params.status = status
      if (search) params.search = search
      if (highRiskOnly) params.high_risk_only = true
      clarAPI.list(params).then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
    } else {
      pharmacyRxAPI.list().then(r => { setRxData(r.data); setLoading(false) }).catch(() => setLoading(false))
    }
  }

  useEffect(() => { load() }, [dept, risk, priority, status, highRiskOnly, viewTab])

  const filtered = search
    ? data.filter(d => d.clarification_id.toLowerCase().includes(search.toLowerCase()))
    : data

  if (selected !== null) {
    return <ClarificationDetail id={selected} onBack={() => { setSelected(null); load() }} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setViewTab('clarifications')}
            className={`pb-2 font-semibold ${viewTab === 'clarifications' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500'}`}
          >
            Priority Queue
          </button>
          <button
            onClick={() => setViewTab('prescriptions')}
            className={`pb-2 font-semibold ${viewTab === 'prescriptions' ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500'}`}
          >
            Incoming Prescriptions
          </button>
        </div>
        <p className="text-sm text-gray-500">{viewTab === 'clarifications' ? filtered.length : rxData.length} items</p>
      </div>

      {/* Filters */}
      {viewTab === 'clarifications' && (
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ID…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-40" />
        </div>
        <Select value={dept} onChange={setDept} options={['', 'Ward', 'Operating Room', 'Outpatient']} label="Department" />
        <Select value={risk} onChange={setRisk} options={['', 'Low', 'Medium', 'High']} label="Risk" />
        <Select value={priority} onChange={setPriority} options={['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']} label="Priority" />
        <Select value={status} onChange={setStatus} options={['', 'Pending', 'Reviewed', 'Resolved']} label="Status" />
        <button onClick={() => setHighRiskOnly(!highRiskOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${highRiskOnly ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          {highRiskOnly ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          High-Risk Pending Only
        </button>
        <button onClick={load} className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors ml-auto">
          Apply Filters
        </button>
      </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {viewTab === 'clarifications' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Priority', 'ID', 'Dept', 'Risk', 'Wait', 'Type', 'Score', 'Status', 'Created', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">No clarifications found</td></tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><PriorityBadge level={row.priority_level} /></td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{row.clarification_id}</td>
                  <td className="px-4 py-3 text-gray-600">{row.department}</td>
                  <td className="px-4 py-3"><RiskBadge risk={row.medicine_risk} /></td>
                  <td className="px-4 py-3 text-gray-600">{row.waiting_time_minutes}m</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{row.clarification_type}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${row.priority_score >= 0.9 ? 'text-red-600' : row.priority_score >= 0.7 ? 'text-orange-600' : row.priority_score >= 0.4 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {row.priority_score?.toFixed(2) ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === 'Resolved' ? 'bg-green-100 text-green-700' : row.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(row.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                      <Eye className="w-3 h-3" /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RX ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dept</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : rxData.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No prescriptions found</td></tr>
              ) : rxData.map(rx => (
                <tr key={rx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-700">{rx.prescription_id}</td>
                  <td className="px-4 py-3 text-gray-600">{rx.patient_id}</td>
                  <td className="px-4 py-3 text-gray-600">{rx.doctor_name}</td>
                  <td className="px-4 py-3 text-gray-600">{rx.department}</td>
                  <td className="px-4 py-3 text-gray-600">{rx.medicine} <RiskBadge risk={rx.medicine_risk} /></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      rx.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      rx.status === 'Clarification Required' ? 'bg-orange-100 text-orange-700' :
                      rx.status === 'Resolved' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{rx.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {rx.status === 'Sent to Pharmacy' ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          const q = prompt("Enter clarification question for doctor:");
                          if (q) {
                            pharmacyRxAPI.clarify(rx.prescription_id, q).then(() => {
                              alert("Clarification requested!");
                              load();
                            }).catch(() => alert("Error"));
                          }
                        }}
                        className="px-3 py-1 bg-orange-100 text-orange-700 font-semibold text-xs rounded hover:bg-orange-200">
                          Ask Clarification
                        </button>
                        <button onClick={() => {
                          if (window.confirm(`Approve prescription ${rx.prescription_id}?`)) {
                            pharmacyRxAPI.approve(rx.prescription_id).then(() => {
                              load();
                            }).catch(() => alert("Failed to approve prescription."));
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white font-semibold text-xs rounded hover:bg-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      </div>
                    ) : rx.status === 'Approved' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 font-semibold text-xs rounded-full">
                        <CheckCircle className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No Action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  )
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-green-500 outline-none bg-white">
      <option value="">{label}</option>
      {options.filter(o => o).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
