import React, { useEffect, useState } from 'react';
import { FilePlus, FileText, UploadCloud, CheckCircle, Bell, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doctorAPI } from '../../services/api';

export default function DoctorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorAPI.dashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good Morning, {data?.doctor_name ? `Dr. ${data.doctor_name}` : 'Doctor'}</h1>
          <p className="text-gray-500 mt-1">Manage prescriptions and respond to pharmacy clarifications.</p>
        </div>
        <Link to="/doctor/new-prescription" className="bg-teal-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-teal-700 transition flex items-center gap-2">
          <FilePlus className="w-4 h-4" />
          New Prescription
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Today's Prescriptions</h3>
          <p className="text-3xl font-bold text-gray-900">{data?.todays_prescriptions || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Pending Clarifications</h3>
          <p className="text-3xl font-bold text-gray-900">{data?.pending_clarifications || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Sent to Pharmacy</h3>
          <p className="text-3xl font-bold text-gray-900">{data?.sent_to_pharmacy || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Resolved Clarifications</h3>
          <p className="text-3xl font-bold text-gray-900">{data?.resolved || 0}</p>
        </div>
      </div>
    </div>
  );
}
