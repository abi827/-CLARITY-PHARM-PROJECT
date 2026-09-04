import React, { useEffect, useState } from 'react'
import { failureAPI } from '../services/api'
import { ShieldAlert, AlertTriangle, Info, CheckCircle } from 'lucide-react'

export default function FailureCases() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    failureAPI.list().then(r => { setCases(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Failure Cases & Edge Cases</h2>
        <p className="text-sm text-gray-500">Documented edge cases where the model may produce unexpected or borderline results</p>
      </div>

      <div className="space-y-4">
        {cases.map((c: any) => (
          <div key={c.case_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-400">{c.case_id}</p>
                  <p className="font-bold text-gray-900 text-sm">{c.title}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c.outcome === 'Correct' ? 'bg-green-50 text-green-700 border-green-200' : c.outcome === 'Borderline' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {c.outcome}
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Input</p>
                <div className="space-y-1">
                  {Object.entries(c.input).map(([k, v]: any) => (
                    <div key={k} className="flex gap-2 text-xs">
                      <span className="text-gray-400 w-32 shrink-0">{k.replace(/_/g, ' ')}:</span>
                      <span className={`font-semibold ${v === null ? 'text-red-500' : 'text-gray-800'}`}>{v === null ? 'MISSING' : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Predicted Priority</p>
                  <p className={`font-bold text-lg ${c.predicted_priority === 'CRITICAL' ? 'text-red-600' : c.predicted_priority === 'HIGH' ? 'text-orange-600' : c.predicted_priority === null ? 'text-gray-400' : 'text-yellow-600'}`}>
                    {c.predicted_priority ?? 'BLOCKED — MISSING DATA'}
                  </p>
                  {c.score != null && <p className="text-xs text-gray-400">Score: {c.score}</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Expected</p>
                  <p className="text-sm font-semibold text-gray-700">{c.expected_priority}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                  <strong>Evidence:</strong> {c.evidence}
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <strong>Lesson:</strong> {c.lesson}
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                  <strong>Recommended Action:</strong> {c.recommended_action}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
