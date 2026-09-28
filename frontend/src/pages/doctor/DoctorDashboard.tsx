import React, { useEffect, useState, useMemo } from 'react';
import { 
  FilePlus, FileText, UploadCloud, CheckCircle, AlertTriangle, 
  Search, Eye, Send, Clock, User, Building, Pill, ArrowRight, 
  RefreshCw, Check, Sparkles, X
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import PrescriptionDetailModal from '../../components/PrescriptionDetailModal';

export default function DoctorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const createdRxId = searchParams.get('created');
  const actionParam = searchParams.get('action');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [createdNotice, setCreatedNotice] = useState<string | null>(createdRxId);

  const fetchDashboardData = (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    // Send today's local date string YYYY-MM-DD
    const localDate = new Date().toISOString().split('T')[0];
    doctorAPI.dashboard(localDate)
      .then(res => {
        setData(res.data);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSendToPharmacy = async (rxId: string) => {
    try {
      setSendingId(rxId);
      await doctorAPI.sendToPharmacy(rxId);
      // Update local state
      if (data?.todays_prescriptions_list) {
        const updatedList = data.todays_prescriptions_list.map((p: any) =>
          p.prescription_id === rxId ? { ...p, status: 'Sent to Pharmacy' } : p
        );
        setData({
          ...data,
          todays_prescriptions_list: updatedList,
          sent_to_pharmacy: (data.sent_to_pharmacy || 0) + 1
        });
      }
      if (selectedPrescription && selectedPrescription.prescription_id === rxId) {
        setSelectedPrescription({ ...selectedPrescription, status: 'Sent to Pharmacy' });
      }
    } catch (e) {
      alert("Failed to send prescription to pharmacy.");
    } finally {
      setSendingId(null);
    }
  };

  const dismissNotice = () => {
    setCreatedNotice(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('created');
    newParams.delete('action');
    setSearchParams(newParams, { replace: true });
  };

  // Filter today's prescriptions
  const filteredPrescriptions = useMemo(() => {
    const list: any[] = data?.todays_prescriptions_list || [];
    return list.filter(p => {
      const matchSearch = 
        p.prescription_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.medicine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data?.todays_prescriptions_list, searchQuery, statusFilter]);

  const riskBadgeClass = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Sent to Pharmacy':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Clarification Required':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Resolved':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const formatTime = (isoStr?: string) => {
    if (!isoStr) return '--:--';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-medium">Loading doctor dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Newly Created Prescription Banner */}
      {createdNotice && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-2">
                <span>Prescription {createdNotice} created successfully!</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 font-semibold uppercase">
                  {actionParam === 'send' ? 'Sent to Pharmacy' : 'Saved as Draft'}
                </span>
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                It has been added to <strong className="font-semibold">Today's Prescriptions</strong> below.
              </p>
            </div>
          </div>
          <button
            onClick={dismissNotice}
            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/50 rounded-lg transition"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Good Morning, {data?.doctor_name ? `Dr. ${data.doctor_name}` : 'Doctor'}
            </h1>
            <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-teal-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-500" /> Prescriber
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage prescriptions and monitor today's pharmacy submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl transition flex items-center justify-center disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          <Link
            to="/doctor/new-prescription"
            className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition flex items-center gap-2 shadow-xs"
          >
            <FilePlus className="w-4 h-4" />
            <span>New Prescription</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Prescriptions Card */}
        <div className="bg-white rounded-2xl p-6 border-2 border-teal-500/30 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-100/70 text-teal-800 px-2 py-0.5 rounded-full">
              Live Today
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1 relative z-10">Today's Prescriptions</h3>
          <div className="flex items-baseline justify-between relative z-10">
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {data?.todays_prescriptions || 0}
            </p>
            <span className="text-xs text-teal-600 font-medium">
              View below ↓
            </span>
          </div>
        </div>

        {/* Pending Clarifications */}
        <Link
          to="/doctor/clarification-requests"
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:border-orange-300 hover:shadow-sm transition group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition" />
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Pending Clarifications</h3>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {data?.pending_clarifications || 0}
          </p>
        </Link>

        {/* Sent to Pharmacy */}
        <Link
          to="/doctor/sent-to-pharmacy"
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:border-purple-300 hover:shadow-sm transition group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition" />
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Sent to Pharmacy</h3>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {data?.sent_to_pharmacy || 0}
          </p>
        </Link>

        {/* Resolved Clarifications */}
        <Link
          to="/doctor/resolved"
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition" />
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Resolved Clarifications</h3>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {data?.resolved || 0}
          </p>
        </Link>
      </div>

      {/* TODAY'S PRESCRIPTIONS SECTION */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">Today's Prescriptions</h2>
              <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-100">
                {data?.todays_prescriptions || 0} Active Today
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Prescriptions entered today and their immediate routing status.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search prescription, patient, medicine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-medium">
              {['All', 'Sent to Pharmacy', 'Draft'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg transition ${
                    statusFilter === status
                      ? 'bg-white text-gray-900 shadow-xs font-semibold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <Link
              to="/doctor/my-prescriptions"
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-teal-50 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Table of Today's Prescriptions */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 text-gray-500 font-medium text-xs border-b border-gray-100 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Prescription ID</th>
                <th className="px-6 py-3.5">Patient & Dept</th>
                <th className="px-6 py-3.5">Medicine & Risk</th>
                <th className="px-6 py-3.5">Dosage / Details</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Time Added</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-6">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                        <FilePlus className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">
                        {data?.todays_prescriptions === 0
                          ? "No prescriptions created today"
                          : "No matching prescriptions found"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {data?.todays_prescriptions === 0
                          ? "Create your first prescription for today using the button below."
                          : "Try adjusting your search query or status filter."}
                      </p>
                      {data?.todays_prescriptions === 0 && (
                        <Link
                          to="/doctor/new-prescription"
                          className="mt-4 inline-flex items-center gap-2 bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-teal-700 transition shadow-xs"
                        >
                          <FilePlus className="w-4 h-4" />
                          Create New Prescription
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((rx: any) => {
                  const isRecentlyCreated = createdNotice === rx.prescription_id;
                  return (
                    <tr
                      key={rx.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isRecentlyCreated ? 'bg-teal-50/40 ring-1 ring-teal-500/30' : ''
                      }`}
                    >
                      {/* Prescription ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50/80 border border-teal-200/80 px-2.5 py-1 rounded-lg">
                            {rx.prescription_id}
                          </span>
                          {isRecentlyCreated && (
                            <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Patient & Dept */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs">{rx.patient_id}</p>
                            <p className="text-[11px] text-gray-400">{rx.department || 'Ward'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Medicine & Risk */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{rx.medicine}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border mt-1 ${riskBadgeClass(rx.medicine_risk)}`}>
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {rx.medicine_risk || 'Low'} Risk
                          </span>
                        </div>
                      </td>

                      {/* Dose / Details */}
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <p className="font-medium text-gray-800">
                            {rx.dose || 'Standard dose'} {rx.frequency ? `• ${rx.frequency}` : ''}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {rx.route || 'Oral'} {rx.duration ? `• ${rx.duration}` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusBadgeClass(rx.status)}`}>
                          {rx.status}
                        </span>
                      </td>

                      {/* Time Added */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatTime(rx.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPrescription(rx)}
                            className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {rx.status === 'Draft' && (
                            <button
                              onClick={() => handleSendToPharmacy(rx.prescription_id)}
                              disabled={sendingId === rx.prescription_id}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg font-medium transition disabled:opacity-50"
                              title="Send to Pharmacy"
                            >
                              <Send className="w-3 h-3" />
                              <span>{sendingId === rx.prescription_id ? 'Sending...' : 'Send'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prescription Detail Modal */}
      <PrescriptionDetailModal
        prescription={selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        onSendToPharmacy={handleSendToPharmacy}
        isSending={sendingId === selectedPrescription?.prescription_id}
      />
    </div>
  );
}
