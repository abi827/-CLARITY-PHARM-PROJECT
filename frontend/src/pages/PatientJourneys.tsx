import React, { useEffect, useState } from 'react'
import { journeyAPI } from '../services/api'
import { CheckCircle, Clock, Users } from 'lucide-react'

export default function PatientJourneys() {
  const [journeys, setJourneys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    journeyAPI.list().then(r => { setJourneys(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading journeys…</div>

  const j = journeys[selected]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Patient Journey Simulations</h2>
        <p className="text-sm text-gray-500">Synthetic patient workflows showing how the prioritisation system affects different case types</p>
      </div>

      <div className="flex gap-3">
        {journeys.map((j: any, i: number) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${selected === i ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
            {j.patient_id} — {j.priority}
          </button>
        ))}
      </div>

      {j && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Journey Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Case Overview</h3>
            {[
              ['Patient ID', j.patient_id],
              ['Prescription', j.prescription_id],
              ['Clarification', j.clarification_id],
              ['Department', j.department],
              ['Medicine Risk', j.medicine_risk],
              ['Waiting Time', `${j.waiting_time_minutes} minutes`],
              ['Clarification Type', j.clarification_type],
              ['Priority', j.priority],
              ['Priority Score', j.priority_score?.toFixed(2)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <span className={`text-xs font-bold ${label === 'Priority' ? (j.priority === 'CRITICAL' ? 'text-red-600' : j.priority === 'HIGH' ? 'text-orange-600' : j.priority === 'LOW' ? 'text-green-600' : 'text-yellow-600') : 'text-gray-900'}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-green-500" /> Workflow Timeline</h3>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-4">
                {j.steps.map((step: any, i: number) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10 border-2 ${step.completed ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'}`}>
                      {step.completed
                        ? <CheckCircle className="w-5 h-5 text-green-600" />
                        : <span className="text-xs font-bold text-gray-400">{i + 1}</span>}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">{step.time}</span>
                        <span className="text-sm font-bold text-gray-900">{step.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">{step.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
