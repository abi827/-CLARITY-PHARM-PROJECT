import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI } from '../../services/api';
import {
  User, Mail, ShieldCheck, Activity, FileText, AlertTriangle,
  UploadCloud, CheckCircle, Stethoscope, Calendar, BarChart2
} from 'lucide-react';

type DashData = {
  doctor_name: string;
  doctor_email: string;
  todays_prescriptions: number;
  pending_clarifications: number;
  sent_to_pharmacy: number;
  resolved: number;
  unread_notifications: number;
};

const STAT_CARDS = [
  { key: 'todays_prescriptions', label: "Today's Prescriptions", icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'pending_clarifications', label: 'Pending Clarifications', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'sent_to_pharmacy', label: 'Sent to Pharmacy', icon: UploadCloud, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
];

export default function Profile() {
  const { user } = useAuth();
  const [dashData, setDashData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorAPI.dashboard()
      .then(res => setDashData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const initial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-teal-600 to-teal-400" />

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-6">
            <div className="w-20 h-20 rounded-full bg-teal-100 border-4 border-white flex items-center justify-center text-teal-700 font-bold text-2xl shadow-md shrink-0">
              {initial}
            </div>
            <div className="flex items-center gap-2 pb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                <Stethoscope className="w-3.5 h-3.5" />
                Prescriber / Doctor
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Name */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">{user?.name || '—'}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Email</p>
                <p className="text-sm font-semibold text-gray-900">{user?.email || '—'}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Role</p>
                <p className="text-sm font-semibold text-gray-900">{user?.role || '—'}</p>
              </div>
            </div>

            {/* System */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">System</p>
                <p className="text-sm font-semibold text-gray-900">CLARITY-PHARM</p>
                <p className="text-xs text-gray-400">Prescription Clarification Prioritiser</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Activity Overview</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
            <div key={key} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
              {loading ? (
                <div className="h-7 w-12 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className={`text-2xl font-bold text-gray-900`}>
                  {dashData ? (dashData as any)[key] ?? 0 : 0}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Account info note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <Calendar className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Demo / Synthetic Data Environment</p>
          <p className="text-sm text-amber-700">
            All prescriptions and patient identifiers in this system are synthetic and for demonstration purposes only.
            No real patient data is stored or processed.
          </p>
        </div>
      </div>
    </div>
  );
}
