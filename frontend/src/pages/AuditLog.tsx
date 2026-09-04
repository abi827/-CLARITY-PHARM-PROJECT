import React, { useEffect, useState } from 'react'
import { auditAPI } from '../services/api'
import { ScrollText } from 'lucide-react'

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auditAPI.list().then(r => { setLogs(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Audit Log</h2>
        <p className="text-sm text-gray-500">Complete record of all important system and user actions</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Timestamp', 'User', 'Role', 'Clarification', 'Action', 'From', 'To', 'Reason'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No audit log entries yet</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                    {l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700 max-w-[150px] truncate">{l.user_email}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{l.user_role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{l.clarification_id || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      l.action === 'Override' ? 'bg-orange-100 text-orange-700' :
                      l.action === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                      l.action === 'USER_LOGIN' ? 'bg-blue-100 text-blue-700' :
                      l.action === 'RUN_EXPERIMENT' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{l.action}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{l.previous_value || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 font-semibold">{l.new_value || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{l.reason || l.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
