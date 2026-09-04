import React from 'react'
import { BookOpen, Code, Database, Server } from 'lucide-react'

export default function Documentation() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Technical Documentation</h2>
        <p className="text-sm text-gray-500">System architecture and API reference</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Server className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-bold text-gray-900">Backend API Reference (FastAPI)</h3>
        </div>
        
        <div className="space-y-6">
          <DocSection method="POST" endpoint="/api/auth/login" desc="Authenticates a user and returns a JWT access token." auth="None" />
          <DocSection method="GET" endpoint="/api/clarifications" desc="Returns a filtered, sorted list of clarification requests." auth="Bearer JWT" />
          <DocSection method="GET" endpoint="/api/clarifications/{id}" desc="Returns detailed info, AI priority score, and evidence for a specific clarification." auth="Bearer JWT" />
          <DocSection method="POST" endpoint="/api/clarifications/{id}/review" desc="Records a human pharmacist review action (Accept/Override/Escalate)." auth="Bearer JWT" />
          <DocSection method="GET" endpoint="/api/dashboard" desc="Aggregates KPIs for the main dashboard view." auth="Bearer JWT" />
          <DocSection method="POST" endpoint="/api/experiments/run" desc="Triggers the synthetic data pipeline to train and evaluate ML models." auth="Bearer JWT" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-green-500" />
          <h3 className="text-lg font-bold text-gray-900">Database Schema (SQLite / SQLAlchemy)</h3>
        </div>
        <p className="text-sm text-gray-700 mb-4">Core tables used in the application:</p>
        <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
          <li><strong>users:</strong> Stores authentication credentials and roles (Pharmacist, Prescriber, etc.)</li>
          <li><strong>clarification_requests:</strong> Primary table holding synthetic prescription and clinical workflow data.</li>
          <li><strong>priority_predictions:</strong> Stores ML-generated scores and JSON explainability evidence. linked 1:1 to clarifications.</li>
          <li><strong>review_actions:</strong> Audit trail of human decisions (overrides, acceptances) linked to clarifications.</li>
          <li><strong>audit_logs:</strong> System-wide security and action tracking.</li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Code className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-bold text-gray-900">ML Pipeline (Scikit-Learn)</h3>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          The machine learning pipeline evaluates three models: <strong>Logistic Regression</strong>, <strong>Random Forest</strong>, and <strong>Gradient Boosting</strong>. Features are preprocessed using `StandardScaler` (numerical) and `OneHotEncoder` (categorical). Models are evaluated based on their ability to accurately prioritise high-risk clarifications (reducing False Negatives) while maintaining high overall Accuracy and F1 Score. The best performing model is serialized via `joblib` for live inference.
        </p>
      </div>
    </div>
  )
}

function DocSection({ method, endpoint, desc, auth }: any) {
  const c = method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${c}`}>{method}</span>
        <code className="text-sm font-semibold text-gray-900">{endpoint}</code>
      </div>
      <p className="text-sm text-gray-600 mb-1">{desc}</p>
      <p className="text-xs text-gray-400">Auth: {auth}</p>
    </div>
  )
}
