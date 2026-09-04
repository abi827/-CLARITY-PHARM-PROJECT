import React, { useEffect, useState } from 'react'
import { modelAPI } from '../services/api'
import { AlertOctagon, TrendingDown, Target, ShieldAlert, CheckCircle } from 'lucide-react'

export default function ErrorAnalysis() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    modelAPI.metrics().then(r => { setMetrics(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Error Analysis & Tuning</h2>
        <p className="text-sm text-gray-500">Live monitoring of model performance and clinical safety boundaries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" /> False Negative Monitoring
          </h3>
          <div className="text-center py-6">
            <p className="text-5xl font-bold text-gray-900 mb-2">{(metrics?.false_negative_rate * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Current False Negative Rate</p>
          </div>
          {metrics?.fn_warning ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800 font-bold mb-1">⚠ Critical Safety Warning</p>
              <p className="text-xs text-red-700">The false negative rate exceeds the 15% safety threshold. The model is missing too many high-risk cases. Immediate retraining or lowering of the HIGH threshold is required.</p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800 font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Within Safety Bounds</p>
              <p className="text-xs text-green-700 mt-1">The false negative rate is below the 15% critical threshold.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-500" /> Human Override Rate
          </h3>
          <div className="text-center py-6">
            <p className="text-5xl font-bold text-gray-900 mb-2">{(metrics?.override_rate * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Of AI recommendations are overridden</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed text-center px-4">
            A high override rate indicates clinical misalignment or operational shift. If this exceeds 20%, investigate the Audit Log to identify patterns in pharmacist corrections.
          </p>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" /> Model Deployment Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Active Model</p>
              <p className="text-sm font-semibold text-gray-900">{metrics?.model_name?.replace('_', ' ').toUpperCase() || 'NONE'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Version</p>
              <p className="text-sm font-semibold text-gray-900">{metrics?.version}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Training Date</p>
              <p className="text-sm font-semibold text-gray-900">{metrics?.training_date ? new Date(metrics.training_date).toLocaleDateString() : '—'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Training Size</p>
              <p className="text-sm font-semibold text-gray-900">{metrics?.dataset_size?.toLocaleString()} records</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
