import React, { useEffect, useState } from 'react';
import { doctorAPI } from '../../services/api';
import { MessageSquare, Check, X } from 'lucide-react';

export default function ClarificationRequests() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clarification Requests</h1>
        <p className="text-gray-500 mt-1">Respond to queries from the pharmacy.</p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : data.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border text-center text-gray-500">
          No pending clarification requests.
        </div>
      ) : (
        data.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 inline-block">
                  {c.status}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{c.clarification_id}</h3>
                <p className="text-sm text-gray-500">Prescription: {c.prescription_id} | Patient: {c.patient_id}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
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
    </div>
  );
}
