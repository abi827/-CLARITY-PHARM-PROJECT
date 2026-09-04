import React from 'react'
import { CheckCircle, ShieldAlert, TrendingUp, Target, FlaskConical, Code } from 'lucide-react'

export default function CapstoneSummary() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Capstone Project Summary</h1>
        <p className="text-gray-500 mt-2 text-lg">CLARITY-PHARM: AI-Assisted Prescription Clarification Prioritisation</p>
      </div>

      {/* Intro */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Executive Summary</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Hospital pharmacists frequently face a high volume of prescription clarification requests. Currently, these are often processed chronologically (first-in, first-out), which risks delaying urgent or high-risk clinical interventions.
        </p>
        <p className="text-gray-700 leading-relaxed">
          <strong>CLARITY-PHARM</strong> is a prototype decision-support system designed to address this. By applying machine learning (Gradient Boosting) to clinical factors (medicine risk, urgency, clarification severity, and waiting time), the system predicts a priority score for each request, ensuring high-risk clarifications surface to the top of the pharmacist's queue immediately.
        </p>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-sm p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-blue-200" />
            <h2 className="text-xl font-bold">Key Finding 1</h2>
          </div>
          <p className="text-3xl font-bold mb-2">91% Early Resolution</p>
          <p className="text-blue-100 text-sm leading-relaxed">
            The Gradient Boosting model achieved a 91% early resolution rate (within 60 mins) for High-Risk medicines in synthetic simulations, compared to just 75% for the rule-based baseline.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl shadow-sm p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-8 h-8 text-green-200" />
            <h2 className="text-xl font-bold">Key Finding 2</h2>
          </div>
          <p className="text-3xl font-bold mb-2">False Negative Mitigation</p>
          <p className="text-green-100 text-sm leading-relaxed">
            By tuning the decision threshold to 0.70, the False Negative Rate was minimised. Explainability panels allow human pharmacists to rapidly verify edge cases and override when necessary.
          </p>
        </div>
      </div>

      {/* Architecture */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Code className="w-6 h-6 text-gray-400" /> System Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Frontend</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>React 18 & TypeScript</li>
              <li>Vite & Tailwind CSS v4</li>
              <li>Recharts (Visualisations)</li>
              <li>JWT Authentication</li>
            </ul>
          </div>
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Backend</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Python 3.9+ & FastAPI</li>
              <li>SQLAlchemy & SQLite</li>
              <li>Passlib (Bcrypt hashing)</li>
              <li>RESTful API architecture</li>
            </ul>
          </div>
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Machine Learning</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Scikit-Learn</li>
              <li>Gradient Boosting Classifier</li>
              <li>Synthetic Data Generator</li>
              <li>Live Inference Engine</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Future Work */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-gray-400" /> Future Work & Limitations
        </h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3"><span className="text-blue-500 font-bold">•</span> This system uses entirely <strong>synthetic data</strong>. Real-world validation with actual hospital data is required before any clinical application.</li>
          <li className="flex gap-3"><span className="text-blue-500 font-bold">•</span> The model relies on structured inputs (e.g., categorical dropdowns). Future iterations could use NLP (LLMs) to extract risk factors directly from free-text clarification notes.</li>
          <li className="flex gap-3"><span className="text-blue-500 font-bold">•</span> Integration with existing Electronic Health Record (EHR) systems (e.g., Epic, Cerner) via SMART on FHIR would be necessary for a live deployment.</li>
        </ul>
      </div>
    </div>
  )
}
