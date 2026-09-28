import React from 'react';
import { X, Send, Calendar, Clock, AlertTriangle, ShieldCheck, User, Building, Pill, FileText, CheckCircle } from 'lucide-react';

interface Prescription {
  id: number;
  prescription_id: string;
  doctor_id: number;
  doctor_name: string;
  patient_id: string;
  department: string;
  medicine: string;
  medicine_risk: string;
  dose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  quantity?: string;
  instructions?: string;
  additional_notes?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface Props {
  prescription: Prescription | null;
  onClose: () => void;
  onSendToPharmacy?: (id: string) => void;
  isSending?: boolean;
}

export default function PrescriptionDetailModal({
  prescription,
  onClose,
  onSendToPharmacy,
  isSending = false
}: Props) {
  if (!prescription) return null;

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

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 font-mono tracking-tight">
                  {prescription.prescription_id}
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusBadgeClass(prescription.status)}`}>
                  {prescription.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Prescribed by Dr. {prescription.doctor_name || 'Prescriber'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Patient & Department Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Patient ID</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{prescription.patient_id}</p>
              </div>
            </div>

            <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Department</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{prescription.department}</p>
              </div>
            </div>
          </div>

          {/* Medicine & Risk */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prescribed Medication</p>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">{prescription.medicine}</h3>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${riskBadgeClass(prescription.medicine_risk)}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {prescription.medicine_risk || 'Low'} Risk
                </span>
              </div>
            </div>

            {/* Regimen Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <p className="text-gray-500">Dose</p>
                <p className="font-semibold text-gray-900 mt-0.5">{prescription.dose || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <p className="text-gray-500">Frequency</p>
                <p className="font-semibold text-gray-900 mt-0.5">{prescription.frequency || 'Not specified'}</p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <p className="text-gray-500">Route</p>
                <p className="font-semibold text-gray-900 mt-0.5">{prescription.route || 'Oral'}</p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <p className="text-gray-500">Duration</p>
                <p className="font-semibold text-gray-900 mt-0.5">{prescription.duration || 'Not specified'}</p>
              </div>
            </div>

            {prescription.quantity && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Quantity to Dispense:</span>
                <span className="font-semibold text-gray-800">{prescription.quantity}</span>
              </div>
            )}
          </div>

          {/* Instructions & Notes */}
          {(prescription.instructions || prescription.additional_notes) && (
            <div className="space-y-3">
              {prescription.instructions && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs">
                  <p className="font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Instructions for Patient
                  </p>
                  <p className="text-blue-800 whitespace-pre-wrap">{prescription.instructions}</p>
                </div>
              )}
              {prescription.additional_notes && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 text-xs">
                  <p className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Pharmacy Clinical Notes
                  </p>
                  <p className="text-amber-800 whitespace-pre-wrap">{prescription.additional_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-400 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created: {formatDate(prescription.created_at)}
            </span>
            {prescription.updated_at && prescription.updated_at !== prescription.created_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Updated: {formatDate(prescription.updated_at)}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 transition"
          >
            Close
          </button>
          {prescription.status === 'Draft' && onSendToPharmacy && (
            <button
              onClick={() => onSendToPharmacy(prescription.prescription_id)}
              disabled={isSending}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Sending...' : 'Send to Pharmacy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
