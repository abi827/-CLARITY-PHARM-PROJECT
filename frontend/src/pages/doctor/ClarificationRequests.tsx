import React, { useEffect, useState } from 'react';
import { doctorAPI } from '../../services/api';
import { MessageSquare, Check, X, Eye, FileText } from 'lucide-react';
import PrescriptionDetailModal from '../../components/PrescriptionDetailModal';

export default function ClarificationRequests() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [selectedRx, setSelectedRx] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    doctorAPI.listClarifications()
      .then(res => setData(res.data.filter((c: any) => c.status !== 'Resolved')))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openRxModal = async (rxId: string) => {
    try {
      const res = await doctorAPI.getPrescription(rxId);
      setSelectedRx(res.data);
    } catch {
      alert("Could not load prescription details.");
    }
  };

  const handleRespond = async (id: number) => {
    if (!responseText.trim()) return;
    try {
      await doctorAPI.respondToClarification(id, { response_text: responseText });
      setRespondingTo(null);
      setResponseText('');
      fetchData();
      alert("Response submitted.");
    } catch (e) {
      alert("Failed to submit response.");
    }
  };

  const displayed = filter === 'pending'
    ? data.filter(c => !c.doctor_response)
    : data;

  const pendingCount = data.filter(c => !c.doctor_response).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clarification Requests</h1>
          <p className="text-gray-500 mt-1">Review and respond to clinical queries from the pharmacy.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All Requests ({data.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading clarification requests...</p>
      ) : displayed.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border text-center text-gray-500">
          {filter === 'pending' ? 'No pending clarification requests awaiting your response.' : 'No clarification requests found.'}
        </div>
      ) : (
        displayed.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 inline-block ${
                  c.status === 'Response Submitted' ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {c.status}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{c.clarification_id}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    Rx: <strong className="text-gray-700 font-mono">{c.prescription_id}</strong> · Patient: <strong className="text-gray-700">{c.patient_id}</strong> · Med: <strong className="text-gray-700">{c.medicine || c.medicine_category}</strong>
                  </span>
                  {c.prescription_id && (
                    <button
                      onClick={() => openRxModal(c.prescription_id)}
                      className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-800 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md hover:bg-teal-100 transition"
                    >
                      <Eye className="w-3 h-3" /> View Rx Details
                    </button>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-1">Pharmacist Question:</p>
              <p className="text-gray-900">{c.pharmacist_question}</p>
            </div>

            {c.doctor_response ? (
               <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                 <p className="text-sm font-semibold text-teal-800 mb-1">Your Response:</p>
                 <p className="text-teal-900">{c.doctor_response}</p>
               </div>
            ) : respondingTo === c.id ? (
              <div className="mt-4">
                <textarea
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  className="w-full border-gray-300 rounded-xl p-3 border focus:ring-teal-500 focus:border-teal-500 mb-2"
                  rows={3}
                  placeholder="Type your clinical response here..."
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setRespondingTo(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Cancel
                  </button>
                  <button onClick={() => handleRespond(c.id)} className="px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Submit
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setRespondingTo(c.id); setResponseText(''); }}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Respond
              </button>
            )}
          </div>
        ))
      )}

      <PrescriptionDetailModal
        prescription={selectedRx}
        onClose={() => setSelectedRx(null)}
      />
    </div>
  );
}
