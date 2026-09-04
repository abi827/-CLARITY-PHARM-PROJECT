import React, { useEffect, useState } from 'react';
import { doctorAPI } from '../../services/api';

export default function SentToPharmacy() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorAPI.listPrescriptions()
      .then(res => {
        setData(res.data.filter((p: any) => p.status !== 'Draft' && p.status !== 'Resolved'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Sent to Pharmacy</h1>
        <p className="text-gray-500 mt-1">Prescriptions currently being processed by the pharmacy.</p>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No prescriptions sent.</td></tr>
            ) : data.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{p.prescription_id}</td>
                <td className="px-6 py-4 text-gray-600">{p.patient_id}</td>
                <td className="px-6 py-4 text-gray-600">{p.department}</td>
                <td className="px-6 py-4 text-gray-600">{p.medicine}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    p.status === 'Sent to Pharmacy' ? 'bg-blue-50 text-blue-700' :
                    p.status === 'Clarification Required' ? 'bg-orange-50 text-orange-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
