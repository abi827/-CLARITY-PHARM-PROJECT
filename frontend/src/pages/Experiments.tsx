import React, { useEffect, useState } from 'react'
import { expAPI } from '../services/api'
import { FlaskConical, Play, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react'

const METRICS = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']

export default function Experiments() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [latestLoading, setLatestLoading] = useState(true)
  const [config, setConfig] = useState({ dataset_size: 10000, random_seed: 42, priority_threshold: 0.70, target_early_res_rate: 0.80, early_res_minutes: 60 })

  useEffect(() => {
    expAPI.latest().then(r => { setResults(r.data); setLatestLoading(false) }).catch(() => setLatestLoading(false))
  }, [])

  const runExperiment = async () => {
    setLoading(true)
    try {
      const r = await expAPI.run(config)
      setResults(r.data)
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Experiment failed.')
    }
    setLoading(false)
  }

  const allModels = results?.metrics ? Object.entries(results.metrics) : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Model Experiments</h2>
        <p className="text-sm text-gray-500">Compare Rule-Based Baseline vs ML Models on synthetic data</p>
      </div>

      {/* Config */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><FlaskConical className="w-5 h-5 text-blue-500" /> Experiment Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[
            { key: 'dataset_size', label: 'Dataset Size', type: 'number' },
            { key: 'random_seed', label: 'Random Seed', type: 'number' },
            { key: 'priority_threshold', label: 'Priority Threshold', type: 'number', step: '0.01' },
            { key: 'target_early_res_rate', label: 'Target Res. Rate', type: 'number', step: '0.01' },
            { key: 'early_res_minutes', label: 'Early Res. (min)', type: 'number' },
          ].map(({ key, label, type, step }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
              <input type={type} step={step || '1'} value={(config as any)[key]}
                onChange={e => setConfig(c => ({ ...c, [key]: +e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          ))}
        </div>
        <button onClick={runExperiment} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
          <Play className="w-4 h-4" />
          {loading ? 'Running Experiment… (this may take ~30 seconds)' : 'Run Experiment'}
        </button>
        {loading && <p className="text-sm text-gray-400 mt-2">Training Logistic Regression, Random Forest, and Gradient Boosting on {config.dataset_size.toLocaleString()} records…</p>}
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Experiment Results</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-blue-200 text-xs uppercase font-semibold">Dataset</p>
                <p className="text-2xl font-bold">{results.dataset_size?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs uppercase font-semibold">Best Model</p>
                <p className="text-2xl font-bold">{results.best_model_display || results.best_model}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs uppercase font-semibold">Target Rate</p>
                <p className="text-2xl font-bold">{((results.target_early_res_rate || 0.8) * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs uppercase font-semibold">Improvement</p>
                <p className={`text-2xl font-bold ${(results.improvement_pp || 0) > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {(results.improvement_pp || 0) > 0 ? '+' : ''}{(results.improvement_pp || 0).toFixed(1)} pp
                </p>
              </div>
            </div>
          </div>

          {/* Early Resolution Metric */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResCard label="Baseline Early Resolution" value={results.baseline_early_res_rate} color="gray" />
            <ResCard label="Target Early Resolution" value={results.target_early_res_rate || 0.8} color="blue" />
            <ResCard label="Best Model Early Resolution" value={results.model_early_res_rate} color="green" />
          </div>

          {/* Model Comparison Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Model Performance Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Model</th>
                    {METRICS.map(m => <th key={m} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{m.replace('_', '-').toUpperCase()}</th>)}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Early Res. Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">FP / FN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allModels.map(([key, m]: any) => (
                    <tr key={key} className={`${key === results.best_model ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {m.name} {key === results.best_model && <span className="ml-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Best</span>}
                      </td>
                      {METRICS.map(metric => (
                        <td key={metric} className="px-4 py-3 text-gray-700">
                          {m[metric] != null ? (m[metric] * 100).toFixed(1) + '%' : '—'}
                        </td>
                      ))}
                      <td className="px-4 py-3 font-bold text-green-700">{((m.high_risk_early_res_rate || 0) * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-gray-600">{m.fp ?? '—'} / {m.fn ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion Matrix for best model */}
          {results.metrics?.[results.best_model] && (
            <ConfusionMatrix m={results.metrics[results.best_model]} name={results.best_model_display || results.best_model} />
          )}

          {/* FP / FN Examples */}
          {(results.fp_examples?.length > 0 || results.fn_examples?.length > 0) && (
            <ErrorExamples fp={results.fp_examples || []} fn={results.fn_examples || []} />
          )}
        </>
      )}

      {!results && !latestLoading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No experiment results yet</p>
          <p className="text-gray-400 text-sm">Click "Run Experiment" to train and evaluate all models.</p>
        </div>
      )}
    </div>
  )
}

function ResCard({ label, value, color }: any) {
  const c = color === 'green' ? 'bg-green-50 border-green-200 text-green-700' : color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'
  return (
    <div className={`rounded-2xl border p-5 ${c}`}>
      <p className="text-xs font-semibold uppercase opacity-70 mb-1">{label}</p>
      <p className="text-4xl font-bold">{((value || 0) * 100).toFixed(1)}%</p>
    </div>
  )
}

function ConfusionMatrix({ m, name }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-bold text-gray-900 mb-4">Confusion Matrix — {name}</h3>
      <div className="flex gap-8 items-start">
        <div>
          <table className="border-collapse text-center">
            <thead>
              <tr>
                <th className="p-2"></th>
                <th colSpan={2} className="p-2 text-xs font-semibold text-gray-500 uppercase">Actual</th>
              </tr>
              <tr>
                <th className="p-2 text-xs font-semibold text-gray-500 uppercase">Predicted</th>
                <th className="p-3 bg-gray-100 rounded-tl-lg text-xs font-bold text-gray-700 w-24">NORMAL</th>
                <th className="p-3 bg-gray-100 rounded-tr-lg text-xs font-bold text-gray-700 w-24">HIGH</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 text-xs font-bold text-gray-700 bg-gray-50">NORMAL</td>
                <td className="p-4 bg-green-100 text-green-800 font-bold text-lg border">TN: {m.tn}</td>
                <td className="p-4 bg-red-100 text-red-800 font-bold text-lg border">FN: {m.fn}</td>
              </tr>
              <tr>
                <td className="p-3 text-xs font-bold text-gray-700 bg-gray-50">HIGH</td>
                <td className="p-4 bg-amber-100 text-amber-800 font-bold text-lg border">FP: {m.fp}</td>
                <td className="p-4 bg-green-100 text-green-800 font-bold text-lg border">TP: {m.tp}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-3 flex-1">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <strong>False Positive (FP: {m.fp}):</strong> Predicted HIGH but actually NORMAL. May cause unnecessary urgency.
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
            <strong>⚠ False Negative (FN: {m.fn}):</strong> Predicted NORMAL but actually HIGH. <strong>This is the most critical error</strong> — a high-priority clarification could be missed.
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
            <strong>True Positives (TP: {m.tp}):</strong> Correctly identified high-priority clarifications.
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorExamples({ fp, fn }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-bold text-gray-900 mb-4">Error Examples from Best Model</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> False Positives</h4>
          {fp.map((e: any, i: number) => (
            <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-2 text-xs">
              <p className="font-bold text-gray-800">{e.clarification_id}</p>
              <p className="text-gray-600">{e.department} · {e.medicine_risk} risk · {e.waiting_time_minutes}min · {e.clarification_type}</p>
              <p className="text-amber-700 mt-1">{e.reason}</p>
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> False Negatives ⚠</h4>
          {fn.map((e: any, i: number) => (
            <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-xl mb-2 text-xs">
              <p className="font-bold text-gray-800">{e.clarification_id}</p>
              <p className="text-gray-600">{e.department} · {e.medicine_risk} risk · {e.waiting_time_minutes}min · {e.clarification_type}</p>
              <p className="text-red-700 mt-1">{e.reason}</p>
              <p className="text-red-600 font-semibold mt-1">⚠ {e.lesson}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
