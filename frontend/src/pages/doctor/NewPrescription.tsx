import React, { useState, useEffect } from 'react';
import { doctorAPI } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowLeft } from 'lucide-react';

export default function NewPrescription() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<string[]>([]);
  const [medicines, setMedicines] = useState<{name: string, risk: string}[]>([]);
  const [pharmacists, setPharmacists] = useState<{id: number, name: string, email: string}[]>([]);
  
  const [form, setForm] = useState({
    patient_id: '',
    department: '',
    medicine: '',
    medicine_risk: '',
    dose: '',
    frequency: '',
    route: '',
    duration: '',
    quantity: '',
    instructions: '',
    additional_notes: '',
    target_pharmacist_id: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    doctorAPI.patientIds().then(res => setPatients(res.data)).catch(console.error);
    doctorAPI.medicines().then(res => setMedicines(res.data)).catch(console.error);
    doctorAPI.pharmacists().then(res => setPharmacists(res.data)).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMedicineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const medName = e.target.value;
    const med = medicines.find(m => m.name === medName);
    setForm({ ...form, medicine: medName, medicine_risk: med ? med.risk : '' });
  };

  const handleSubmit = async (action: 'draft' | 'send') => {
    if (!form.patient_id || !form.department || !form.medicine) {
      alert("Please fill in Patient, Department, and Medicine.");
      return;
    }
    setLoading(true);
    try {
      const payload: any = { ...form, action };
      if (payload.target_pharmacist_id === '') {
        payload.target_pharmacist_id = null;
      } else if (payload.target_pharmacist_id) {
        payload.target_pharmacist_id = parseInt(payload.target_pharmacist_id, 10);
      }

      const res = await doctorAPI.createPrescription(payload);
      const rxId = res.data?.prescription?.prescription_id || '';
      navigate(`/doctor/dashboard?created=${rxId}&action=${action}`);
    } catch (err) {
      console.error(err);
      alert("Error creating prescription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/doctor/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-teal-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Prescription</h1>
        <p className="text-gray-500 mt-1">Create and send a prescription to the pharmacy.</p>
      </div>

      <div className="space-y-8">
        {/* SECTION 1 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">SECTION 1 - PATIENT INFORMATION</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID (Synthetic) *</label>
              <select name="patient_id" value={form.patient_id} onChange={handleChange} className="w-full border-gray-300 rounded-xl p-2.5 bg-gray-50 border focus:ring-teal-500 focus:border-teal-500">
                <option value="">Select Patient ID</option>
                {patients.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select name="department" value={form.department} onChange={handleChange} className="w-full border-gray-300 rounded-xl p-2.5 bg-gray-50 border focus:ring-teal-500 focus:border-teal-500">
                <option value="">Select Department</option>
                <option value="Ward">Ward</option>
                <option value="Operating Room">Operating Room</option>
                <option value="Outpatient">Outpatient</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">SECTION 2 - PRESCRIPTION DETAILS</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine *</label>
              <select name="medicine" value={form.medicine} onChange={handleMedicineChange} className="w-full border-gray-300 rounded-xl p-2.5 bg-gray-50 border focus:ring-teal-500 focus:border-teal-500">
                <option value="">Search or select medicine</option>
                {medicines.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Risk</label>
              <div className="w-full border-gray-300 rounded-xl p-2.5 bg-gray-100 border text-gray-600 font-semibold uppercase flex items-center gap-2">
                 {form.medicine_risk ? (
                   <>
                    <Activity className="w-4 h-4" />
                    {form.medicine_risk}
                   </>
                 ) : 'Auto-detected'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dose</label>
              <input type="text" name="dose" value={form.dose} onChange={handleChange} placeholder="e.g., 500 mg" className="w-full border-gray-300 rounded-xl p-2.5 bg-white border focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <input type="text" name="frequency" value={form.frequency} onChange={handleChange} placeholder="e.g., Twice daily" className="w-full border-gray-300 rounded-xl p-2.5 bg-white border focus:ring-teal-500 focus:border-teal-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <input type="text" name="route" value={form.route} onChange={handleChange} placeholder="e.g., Oral" className="w-full border-gray-300 rounded-xl p-2.5 bg-white border focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input type="text" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g., 5 days" className="w-full border-gray-300 rounded-xl p-2.5 bg-white border focus:ring-teal-500 focus:border-teal-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="text" name="quantity" value={form.quantity} onChange={handleChange} placeholder="e.g., 10 tablets" className="w-full border-gray-300 rounded-xl p-2.5 bg-white border focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <input type="text" name="instructions" value={form.instructions} onChange={handleChange} placeholder="e.g., Take with plenty of water" className="w-full border-gray-300 rounded-xl p-2.5 bg-white border focus:ring-teal-500 focus:border-teal-500" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea name="additional_notes" value={form.additional_notes} onChange={handleChange} placeholder="Optional notes for pharmacy" rows={3} className="w-full border-gray-300 rounded-xl p-2.5 bg-white border focus:ring-teal-500 focus:border-teal-500"></textarea>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Pharmacist (Optional)</label>
              <select
                name="target_pharmacist_id"
                value={form.target_pharmacist_id}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-xl p-2.5 bg-gray-50 border focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">General Pharmacy Pool (Any available pharmacist)</option>
                {pharmacists.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="flex gap-4 pt-4 border-t">
          <button disabled={loading} onClick={() => handleSubmit('draft')} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
            Save Draft
          </button>
          <button disabled={loading} onClick={() => handleSubmit('send')} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition">
            {loading ? 'Processing...' : 'Send to Pharmacy'}
          </button>
        </div>

      </div>
    </div>
  );
}
