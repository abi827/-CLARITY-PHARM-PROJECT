import React, { useEffect, useState } from 'react'
import { settingsAPI } from '../services/api'
import { Settings as SettingsIcon, Save, ShieldAlert, CheckCircle } from 'lucide-react'

export default function Settings() {
  const [thresholds, setThresholds] = useState({ high: 0.70, critical: 0.90 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    settingsAPI.getThresholds().then(r => { setThresholds(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await settingsAPI.updateThresholds(thresholds)
      setMsg('Settings saved successfully.')
      setTimeout(() => setMsg(''), 3000)
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || 'Error saving settings.')
    }
    setSaving(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
        <p className="text-sm text-gray-500">Configure core prioritisation thresholds</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-gray-500" /> Priority Thresholds
        </h3>

        {msg && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {msg}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-900 flex justify-between">
              <span>HIGH Priority Threshold</span>
              <span className="text-orange-600">{thresholds.high.toFixed(2)}</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Scores above this will be marked as HIGH priority.</p>
            <input type="range" min="0" max="1" step="0.01" value={thresholds.high}
              onChange={e => setThresholds(t => ({ ...t, high: +e.target.value }))}
              className="w-full accent-orange-500" />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-900 flex justify-between">
              <span>CRITICAL Priority Threshold</span>
              <span className="text-red-600">{thresholds.critical.toFixed(2)}</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Scores above this will be marked as CRITICAL priority.</p>
            <input type="range" min="0" max="1" step="0.01" value={thresholds.critical}
              onChange={e => setThresholds(t => ({ ...t, critical: +e.target.value }))}
              className="w-full accent-red-500" />
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Warning:</strong> Adjusting these thresholds will immediately impact how new clarifications are prioritised. Lowering the HIGH threshold may result in alert fatigue, while raising it may cause high-risk clarifications to be missed (false negatives).
            </p>
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
