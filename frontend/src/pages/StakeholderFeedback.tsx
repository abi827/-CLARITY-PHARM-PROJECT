import React, { useEffect, useState } from 'react'
import { feedbackAPI } from '../services/api'
import { MessageSquare, Star, CheckCircle, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function StakeholderFeedback() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ q1_queue_clarity: 5, q2_evidence_clarity: 5, q3_workflow_practical: 5, q4_reduce_delays: 5, q5_review_points_clear: 5, q6_false_negatives_clear: 5, comments: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const load = () => {
    feedbackAPI.summary().then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await feedbackAPI.submit(form)
      setSuccess(true)
      load()
    } catch {}
    setSubmitting(false)
  }

  const QUESTIONS = [
    { key: 'q1_queue_clarity', label: '1. The Priority Queue is clear and easy to navigate.' },
    { key: 'q2_evidence_clarity', label: '2. The AI Evidence and Explainability panel is clear.' },
    { key: 'q3_workflow_practical', label: '3. The human review workflow (Accept/Override) is practical.' },
    { key: 'q4_reduce_delays', label: '4. The system could help reduce delays for high-risk patients.' },
    { key: 'q5_review_points_clear', label: '5. The points where human judgment is required are obvious.' },
    { key: 'q6_false_negatives_clear', label: '6. The risk of false negatives (missed high-priority cases) is adequately addressed.' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Stakeholder Feedback</h2>
        <p className="text-sm text-gray-500">Submit and review feedback on the Clarity-Pharm system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" /> Submit Feedback
          </h3>
          
          {success ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-gray-900">Feedback Submitted</h4>
              <p className="text-sm text-gray-500 mt-1">Thank you for helping improve the system.</p>
              <button onClick={() => setSuccess(false)} className="mt-6 text-blue-600 text-sm font-semibold hover:underline">Submit another response</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-4">
                {QUESTIONS.map(q => (
                  <div key={q.key} className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm font-semibold text-gray-800 mb-3">{q.label}</p>
                    <div className="flex justify-between items-center px-4">
                      <span className="text-xs text-gray-400">Strongly Disagree</span>
                      <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map(v => (
                          <label key={v} className="flex flex-col items-center gap-1 cursor-pointer">
                            <input type="radio" name={q.key} value={v} checked={(form as any)[q.key] === v}
                              onChange={() => setForm(f => ({ ...f, [q.key]: v }))}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                            <span className="text-xs text-gray-500">{v}</span>
                          </label>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">Strongly Agree</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-2">Additional Comments</label>
                <textarea required value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="What works well? What needs improvement?" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                <Send className="w-4 h-4" /> {submitting ? 'Submitting…' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Average Ratings ({data?.count || 0} responses)
            </h3>
            
            {loading ? <p className="text-sm text-gray-400">Loading…</p> : data?.count === 0 ? <p className="text-sm text-gray-400">No feedback submitted yet.</p> : (
              <div className="space-y-4">
                {[
                  ['Queue Navigation Clarity', data.averages.queue_clarity],
                  ['Evidence Panel Clarity', data.averages.evidence_clarity],
                  ['Review Workflow Practicality', data.averages.workflow_practical],
                  ['Potential to Reduce Delays', data.averages.reduce_delays],
                  ['Human Judgment Points Clear', data.averages.review_points_clear],
                  ['False Negative Risk Addressed', data.averages.false_negatives_clear]
                ].map(([label, val]: any, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="font-bold text-gray-900">{val} / 5.0</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(val / 5) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-h-[500px] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 mb-4">Recent Comments</h3>
            {loading ? <p className="text-sm text-gray-400">Loading…</p> : data?.count === 0 ? <p className="text-sm text-gray-400">No comments yet.</p> : (
              <div className="space-y-4">
                {data.responses.filter((r: any) => r.comments).map((r: any, i: number) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{r.user_role}</p>
                        <p className="text-[10px] text-gray-500">{r.user_email}</p>
                      </div>
                      {r.is_synthetic && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">SYNTHETIC DEMO</span>}
                    </div>
                    <p className="text-sm text-gray-700 italic">"{r.comments}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
