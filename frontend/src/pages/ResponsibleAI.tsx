import React from 'react'
import { ShieldCheck, Scale, Eye, Lock } from 'lucide-react'

export default function ResponsibleAI() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Responsible AI Framework</h2>
        <p className="text-sm text-gray-500">Ethical considerations and safety guardrails</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Decision-Support Boundary</h3>
        <p className="text-sm text-amber-800 leading-relaxed">
          CLARITY-PHARM operates strictly within a <strong>Decision-Support Boundary</strong>. The AI model only reorganises the queue sequence based on predicted urgency. It <strong>never</strong> automatically resolves a clarification, modifies a prescription, or messages a prescriber without explicit human action. The final clinical decision always remains with a qualified pharmacist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <Scale className="w-6 h-6 text-blue-500 mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Bias & Fairness</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            The model is trained solely on operational factors (department, waiting time) and clinical factors (medicine risk, severity). Protected characteristics (age, gender, ethnicity) are intentionally excluded from the dataset to prevent demographic bias in prioritisation.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <Eye className="w-6 h-6 text-green-500 mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Explainability</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            "Black box" AI is unacceptable in healthcare. Every priority prediction is accompanied by an evidence payload detailing the exact percentage contribution of each feature (e.g., Medicine Risk: 40%). This empowers the pharmacist to trust or reject the model's output.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <Lock className="w-6 h-6 text-purple-500 mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Auditability</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Every action taken by a human reviewer—especially overriding an AI recommendation—is logged in an immutable audit trail with an explicit reason. This is crucial for clinical governance and iterative model improvement.
          </p>
        </div>
      </div>
    </div>
  )
}
