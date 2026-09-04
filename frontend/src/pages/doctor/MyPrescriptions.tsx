import React, { useEffect, useState } from 'react';
import { doctorAPI } from '../../services/api';
import { Eye, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyPrescriptions() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorAPI.listPrescriptions()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sendToPharmacy = async (id: string) => {
    try {
      await doctorAPI.sendToPharmacy(id);
      setData(data.map(p => p.prescription_id === id ? { ...p, status: 'Sent to Pharmacy' } : p));
      alert("Sent to pharmacy!");
    } catch (e) {
      alert("Failed to send.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">My Prescriptions</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Prescription ID</th>
              <th className="px-6 py-4">Patient ID</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Medicine</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No prescriptions found.</td></tr>
            ) : data.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{p.prescription_id}</td>
                <td className="px-6 py-4 text-gray-600">{p.patient_id}</td>
                <td className="px-6 py-4 text-gray-600">{p.department}</td>
                <td className="px-6 py-4 text-gray-600">{p.medicine}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    p.status === 'Draft' ? 'bg-gray-100 text-gray-600' :
                    p.status === 'Sent to Pharmacy' ? 'bg-blue-50 text-blue-700' :
                    p.status === 'Clarification Required' ? 'bg-orange-50 text-orange-700' :
                    p.status === 'Resolved' ? 'bg-green-50 text-green-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    {p.status === 'Draft' && (
                      <button onClick={() => sendToPharmacy(p.prescription_id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Send to Pharmacy">
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
