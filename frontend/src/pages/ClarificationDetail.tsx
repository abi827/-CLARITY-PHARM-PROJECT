import React, { useEffect, useState } from 'react'
import { clarAPI } from '../services/api'
import { ArrowLeft, ShieldAlert, Clock, AlertTriangle, CheckCircle, XCircle, ChevronUp, Info, FileText, MessageSquare } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '../context/AuthContext'

const PRIORITY_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }

function PBadge({ level }: { level: string }) {
  const c = level === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200'
    : level === 'HIGH' ? 'bg-orange-100 text-orange-700 border-orange-200'
    : level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-green-100 text-green-700 border-green-200'
  return <span className={`px-3 py-1 rounded-full text-sm font-bold border ${c}`}>{level}</span>
}

export default function ClarificationDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showOverride, setShowOverride] = useState(false)
  const [showResolve, setShowResolve] = useState(false)
  const [overrideForm, setOverrideForm] = useState({ new_priority: 'MEDIUM', reason: '' })
  const [resolveForm, setResolveForm] = useState({ outcome: 'Resolved after clarification', resolution_time_minutes: 30, notes: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => {
    clarAPI.get(id).then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const doAction = async (action_type: string, new_priority?: string, reason?: string) => {
    setSaving(true); setMsg('')
    try {
      await clarAPI.review(id, { action_type, new_priority: new_priority || data.priority_level, reason: reason || action_type })
      setMsg(`✅ ${action_type} saved.`)
      setShowOverride(false)
      load()
    } catch { setMsg('❌ Error saving action.') }
    setSaving(false)
  }

  const doResolve = async () => {
    setSaving(true); setMsg('')
    try {
      await clarAPI.resolve(id, resolveForm)
      setMsg('✅ Clarification resolved.')
      setShowResolve(false)
      load()
    } catch { setMsg('❌ Error resolving.') }
    setSaving(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (!data) return <div className="text-center py-20 text-red-500">Failed to load clarification.</div>

  const evidence = data.evidence || {}
  const contributions = evidence.contributions || {}
  const chartData = Object.entries(contributions).map(([k, v]: any) => ({
    name: k.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    value: Math.round(v * 100)
  }))

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </button>

      {msg && <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-mono">{data.clarification_id}</h2>
                <p className="text-gray-500 text-sm mt-1">Patient: {data.patient_id} · Rx: {data.prescription_id}</p>
              </div>
              <PBadge level={data.priority_level} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['Medicine', data.medicine_name || data.medicine_category || '—'],
                ['Dose', data.dose || '—'],
                ['Department', data.department],
                ['Medicine Risk', data.medicine_risk],
                ['Waiting Time', `${data.waiting_time_minutes} minutes`],
                ['Clarification Type', data.clarification_type],
                ['Status', data.status],
                ['Urgency', data.urgency || 'Standard'],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Linked Prescription & Doctor Communication */}
          {(data.linked_prescription || data.pharmacist_question || data.doctor_response) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="text-base font-bold text-gray-900">Linked Prescription & Prescriber Q&A</h3>
                </div>
                {data.linked_prescription && (
                  <span className="font-mono text-xs px-2.5 py-1 bg-green-50 text-green-800 rounded-lg font-bold border border-green-200">
                    {data.linked_prescription.prescription_id}
                  </span>
                )}
              </div>

              {data.linked_prescription && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block">Medicine</span>
                    <span className="font-bold text-gray-800 text-sm">{data.linked_prescription.medicine}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Dose / Frequency</span>
                    <span className="font-semibold text-gray-800">{data.linked_prescription.dose} · {data.linked_prescription.frequency || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Route / Urgency</span>
                    <span className="font-semibold text-gray-800">{data.linked_prescription.route || 'Oral'} ({data.linked_prescription.urgency})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Prescriber</span>
                    <span className="font-semibold text-gray-800">Dr. {data.linked_prescription.doctor_name || 'Prescriber'}</span>
                  </div>
                  {data.linked_prescription.instructions && (
                    <div className="col-span-2 sm:col-span-4 mt-1 pt-2 border-t border-gray-200">
                      <span className="text-gray-400 font-medium">Clinical Instructions: </span>
                      <span className="text-gray-700 italic">{data.linked_prescription.instructions}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Q&A Thread */}
              <div className="space-y-3">
                {data.pharmacist_question && (
                  <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Pharmacist Clarification Request
                    </p>
                    <p className="text-sm text-gray-800 italic">"{data.pharmacist_question}"</p>
                  </div>
                )}

                {data.doctor_response ? (
                  <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl">
                    <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-teal-600" /> Prescriber Clarification Response
                    </p>
                    <p className="text-sm text-gray-900 font-medium">"{data.doctor_response}"</p>
                  </div>
                ) : data.pharmacist_question ? (
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-gray-500 text-xs">
                    <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                    <span>Awaiting doctor response to this clarification request.</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Evidence / Explainability */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold text-gray-900">Evidence & Explainability</h3>
            </div>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
              <strong>Why this was prioritised:</strong> {evidence.reason || 'Priority calculated based on medicine risk, waiting time, department urgency, and clarification severity.'}
            </div>

            <p className="text-xs text-gray-500 mb-3 uppercase font-semibold tracking-wider">Factor Contributions (% of score)</p>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <XAxis type="number" domain={[0, 50]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'Contribution']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={['#22c55e', '#3b82f6', '#f97316', '#a855f7'][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm">No contribution data available.</p>}

            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3 mt-4 font-medium">
              ⚕️ This is AI decision-support only. A qualified pharmacist must review this recommendation before any action.
            </p>
          </div>

          {/* Review History */}
          {data.reviews?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Review History</h3>
              <div className="space-y-3">
                {data.reviews.map((r: any, i: number) => (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                      {r.pharmacist_id?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{r.pharmacist_id} · {r.action_type}</p>
                      {r.previous_priority !== r.new_priority && <p className="text-xs text-gray-500">{r.previous_priority} → {r.new_priority}</p>}
                      {r.reason && <p className="text-xs text-gray-600 mt-0.5">"{r.reason}"</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">Priority Score</h3>
            <div className="text-5xl font-bold text-center py-4" style={{ color: PRIORITY_COLORS[data.priority_level] }}>
              {data.priority_score?.toFixed(2) ?? '—'}
            </div>
            <p className="text-center text-xs text-gray-400">0.00 (Low) → 1.00 (Critical)</p>
          </div>

          {data.status !== 'Resolved' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
              <h3 className="text-base font-bold text-gray-900 mb-2">Human Review</h3>

              <button onClick={() => doAction('Accept', data.priority_level, 'Pharmacist accepts AI recommendation')} disabled={saving}
                className="w-full flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Accept Priority
              </button>

              <button onClick={() => setShowOverride(!showOverride)} disabled={saving}
                className="w-full flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors text-sm font-semibold">
                <ChevronUp className="w-4 h-4" /> Override Priority
              </button>

              {showOverride && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                  <label className="text-xs font-semibold text-gray-700">New Priority</label>
                  <select value={overrideForm.new_priority} onChange={e => setOverrideForm(f => ({ ...f, new_priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <label className="text-xs font-semibold text-gray-700">Reason (required)</label>
                  <select onChange={e => setOverrideForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="">Select reason…</option>
                    {['Additional clinical context', 'Incorrect input data', 'Model error', 'Operational reason', 'Duplicate clarification', 'Other'].map(r => <option key={r}>{r}</option>)}
                  </select>
                  <textarea value={overrideForm.reason} onChange={e => setOverrideForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Describe the override reason…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20" />
                  <button onClick={() => doAction('Override', overrideForm.new_priority, overrideForm.reason)} disabled={!overrideForm.reason || saving}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50">
                    Confirm Override
                  </button>
                </div>
              )}

              <button onClick={() => doAction('Escalate', 'CRITICAL', 'Escalated for urgent review')} disabled={saving}
                className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" /> Escalate
              </button>

              <button onClick={() => doAction('Request More Information', data.priority_level, 'Additional information required')} disabled={saving}
                className="w-full flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold">
                <Info className="w-4 h-4" /> Request More Info
              </button>

              <button onClick={() => setShowResolve(!showResolve)} disabled={saving}
                className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Mark Resolved
              </button>

              {showResolve && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <select value={resolveForm.outcome} onChange={e => setResolveForm(f => ({ ...f, outcome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {['Resolved quickly', 'Resolved after clarification', 'Escalated', 'Cancelled'].map(o => <option key={o}>{o}</option>)}
                  </select>
                  <input type="number" value={resolveForm.resolution_time_minutes}
                    onChange={e => setResolveForm(f => ({ ...f, resolution_time_minutes: +e.target.value }))}
                    placeholder="Resolution time (minutes)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <textarea value={resolveForm.notes} onChange={e => setResolveForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Resolution notes…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-16" />
                  <button onClick={doResolve} disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                    Confirm Resolution
                  </button>
                </div>
              )}
            </div>
          )}

          {data.status === 'Resolved' && data.resolution && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-base font-bold text-green-900">Resolved</h3>
              </div>
              <p className="text-sm text-green-800"><strong>Outcome:</strong> {data.resolution.outcome}</p>
              <p className="text-sm text-green-800"><strong>Time:</strong> {data.resolution.resolution_time_minutes} min</p>
              <p className="text-sm text-green-800"><strong>By:</strong> {data.resolution.resolved_by}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
