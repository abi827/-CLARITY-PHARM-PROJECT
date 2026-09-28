import React, { useEffect, useState } from 'react'
import { clarAPI, pharmacyRxAPI } from '../services/api'
import { Search, Filter, Eye, AlertTriangle, Clock, ShieldAlert, CheckCircle, ToggleLeft, ToggleRight, MessageSquare, X } from 'lucide-react'
import ClarificationDetail from './ClarificationDetail'
import PrescriptionDetailModal from '../components/PrescriptionDetailModal'

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
  const [selectedRx, setSelectedRx] = useState<any>(null)
  const [viewResponseRx, setViewResponseRx] = useState<any>(null)

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
    ? data.filter(d => 
        d.clarification_id?.toLowerCase().includes(search.toLowerCase()) ||
        d.medicine_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.medicine_category?.toLowerCase().includes(search.toLowerCase()) ||
        d.department?.toLowerCase().includes(search.toLowerCase()) ||
        d.patient_id?.toLowerCase().includes(search.toLowerCase())
      )
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
            placeholder="Search ID, Medicine…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-52" />
        </div>
        <Select value={dept} onChange={setDept} options={['', 'Ward', 'Operating Room', 'Outpatient']} label="Department" />
        <Select value={risk} onChange={setRisk} options={['', 'Low', 'Medium', 'High']} label="Risk" />
        <Select value={priority} onChange={setPriority} options={['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']} label="Priority" />
        <Select value={status} onChange={setStatus} options={['', 'Pending', 'Response Submitted', 'Reviewed', 'Resolved']} label="Status" />
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

      {/* Filters for Prescriptions */}
      {viewTab === 'prescriptions' && (
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search Rx, Patient, Doctor…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-64" />
        </div>
        <button onClick={load} className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors ml-auto">
          Refresh
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
                {['Priority', 'ID', 'Medicine', 'Dose', 'Dept', 'Risk', 'Wait', 'Type', 'Score', 'Status', 'Created', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={12} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-12 text-gray-400">No clarifications found</td></tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><PriorityBadge level={row.priority_level} /></td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{row.clarification_id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{row.medicine_name || row.medicine_category || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{row.dose || '—'}</td>
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
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                        row.status === 'Response Submitted' ? 'bg-teal-100 text-teal-800' :
                        row.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {row.status}
                      </span>
                      {row.doctor_response && row.status !== 'Resolved' && (
                        <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          Doctor Responded
                        </span>
                      )}
                    </div>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : rxData.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No prescriptions found</td></tr>
              ) : rxData
                .filter(rx => !search || 
                  rx.prescription_id?.toLowerCase().includes(search.toLowerCase()) || 
                  rx.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
                  rx.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
                  rx.medicine?.toLowerCase().includes(search.toLowerCase())
                )
                .map(rx => (
                <tr key={rx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-700">{rx.prescription_id}</td>
                  <td className="px-4 py-3 text-gray-600">{rx.patient_id}</td>
                  <td className="px-4 py-3 text-gray-600">{rx.doctor_name}</td>
                  <td className="px-4 py-3 text-gray-600">{rx.department}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span>{rx.medicine}</span>
                      <RiskBadge risk={rx.medicine_risk} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        rx.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        rx.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                        rx.status === 'Response Submitted' ? 'bg-teal-100 text-teal-800' :
                        rx.status === 'Clarification Required' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {rx.status}
                      </span>
                      {rx.doctor_response && rx.status !== 'Approved' && rx.status !== 'Resolved' && (
                        <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          Doctor Responded
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRx(rx)}
                        title="View Full Details"
                        className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {rx.status === 'Sent to Pharmacy' && (
                        <>
                          <button onClick={() => {
                            const q = prompt("Enter clarification question for doctor:");
                            if (q) {
                              pharmacyRxAPI.clarify(rx.prescription_id, q).then(() => {
                                alert("Clarification requested and sent to doctor!");
                                load();
                              }).catch(() => alert("Error requesting clarification."));
                            }
                          }}
                          className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 font-semibold text-xs rounded-lg flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Clarify
                          </button>
                          <button onClick={() => {
                            if (window.confirm(`Approve prescription ${rx.prescription_id}?`)) {
                              pharmacyRxAPI.approve(rx.prescription_id).then(() => {
                                load();
                              }).catch(() => alert("Failed to approve prescription."));
                            }
                          }}
                          className="px-2.5 py-1 bg-green-600 text-white font-semibold text-xs rounded-lg hover:bg-green-700 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        </>
                      )}

                      {rx.status === 'Response Submitted' && (
                        <>
                          <button onClick={() => setViewResponseRx(rx)}
                            className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 font-semibold text-xs rounded-lg flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> View Response
                          </button>
                          <button onClick={() => {
                            if (window.confirm(`Approve prescription ${rx.prescription_id}?`)) {
                              pharmacyRxAPI.approve(rx.prescription_id).then(() => {
                                load();
                              }).catch(() => alert("Failed to approve prescription."));
                            }
                          }}
                          className="px-2.5 py-1 bg-green-600 text-white font-semibold text-xs rounded-lg hover:bg-green-700 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        </>
                      )}

                      {rx.status === 'Clarification Required' && (
                        <button onClick={() => setViewResponseRx(rx)}
                          className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 font-semibold text-xs rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3" /> View Question
                        </button>
                      )}

                      {(rx.status === 'Approved' || rx.status === 'Resolved') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 font-semibold text-xs rounded-full border border-green-200">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Prescription Detail Modal */}
      <PrescriptionDetailModal prescription={selectedRx} onClose={() => setSelectedRx(null)} />

      {/* Doctor Response Modal */}
      {viewResponseRx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Doctor Communication</h3>
                <p className="text-xs text-gray-500 font-mono">Prescription: {viewResponseRx.prescription_id} · Patient: {viewResponseRx.patient_id}</p>
              </div>
              <button onClick={() => setViewResponseRx(null)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Prescribed Medicine:</span>
                  <span className="font-bold text-gray-800">{viewResponseRx.medicine} {viewResponseRx.dose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Instructions / Frequency:</span>
                  <span className="text-gray-700">{viewResponseRx.frequency || 'Standard'} {viewResponseRx.route ? `via ${viewResponseRx.route}` : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Prescriber:</span>
                  <span className="text-gray-700 font-medium">Dr. {viewResponseRx.doctor_name}</span>
                </div>
              </div>

              {/* Pharmacist Question */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Pharmacist Clarification Request
                </p>
                <p className="text-sm text-gray-800 italic">"{viewResponseRx.pharmacist_question || 'Clarification requested on dosage or clinical regimen.'}"</p>
              </div>

              {/* Doctor's Response */}
              {viewResponseRx.doctor_response ? (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <p className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" /> Prescriber Response (Dr. {viewResponseRx.doctor_name})
                  </p>
                  <p className="text-sm text-gray-900 font-medium">"{viewResponseRx.doctor_response}"</p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span>Awaiting prescriber response to clarification...</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setViewResponseRx(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                Close
              </button>
              {viewResponseRx.status !== 'Approved' && viewResponseRx.status !== 'Resolved' && (
                <button onClick={() => {
                  if (window.confirm(`Approve prescription ${viewResponseRx.prescription_id} now?`)) {
                    pharmacyRxAPI.approve(viewResponseRx.prescription_id).then(() => {
                      setViewResponseRx(null);
                      load();
                    }).catch(() => alert("Failed to approve prescription."));
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve Prescription
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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
