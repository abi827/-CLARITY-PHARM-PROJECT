import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import AppLayout from './components/AppLayout'
import DoctorLayout from './components/DoctorLayout'

// Pages
import Login from './Login'
import SignUp from './SignUp'
import Dashboard from './pages/Dashboard'
import PriorityQueue from './pages/PriorityQueue'
import PatientJourneys from './pages/PatientJourneys'
import Analytics from './pages/Analytics'
import Experiments from './pages/Experiments'
import ErrorAnalysis from './pages/ErrorAnalysis'
import FailureCases from './pages/FailureCases'
import StakeholderFeedback from './pages/StakeholderFeedback'
import Documentation from './pages/Documentation'
import ResponsibleAI from './pages/ResponsibleAI'
import AuditLog from './pages/AuditLog'
import Settings from './pages/Settings'
import CapstoneSummary from './pages/CapstoneSummary'

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import NewPrescription from './pages/doctor/NewPrescription'
import MyPrescriptions from './pages/doctor/MyPrescriptions'
import ClarificationRequests from './pages/doctor/ClarificationRequests'
import SentToPharmacy from './pages/doctor/SentToPharmacy'
import Resolved from './pages/doctor/Resolved'
import Notifications from './pages/doctor/Notifications'
import Profile from './pages/doctor/Profile'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Pharmacist Routes */}
          <Route path="/" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><Navigate to="/dashboard" replace /></AppLayout></RoleRoute>} />
          <Route path="/dashboard" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><Dashboard /></AppLayout></RoleRoute>} />
          <Route path="/priority-queue" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><PriorityQueue /></AppLayout></RoleRoute>} />
          <Route path="/clarifications" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><PriorityQueue /></AppLayout></RoleRoute>} />
          <Route path="/patient-journeys" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><PatientJourneys /></AppLayout></RoleRoute>} />
          <Route path="/analytics" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><Analytics /></AppLayout></RoleRoute>} />
          <Route path="/experiments" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><Experiments /></AppLayout></RoleRoute>} />
          <Route path="/error-analysis" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><ErrorAnalysis /></AppLayout></RoleRoute>} />
          <Route path="/failure-cases" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><FailureCases /></AppLayout></RoleRoute>} />
          <Route path="/stakeholder-feedback" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><StakeholderFeedback /></AppLayout></RoleRoute>} />
          <Route path="/documentation" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><Documentation /></AppLayout></RoleRoute>} />
          <Route path="/responsible-ai" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><ResponsibleAI /></AppLayout></RoleRoute>} />
          <Route path="/audit-log" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><AuditLog /></AppLayout></RoleRoute>} />
          <Route path="/settings" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><Settings /></AppLayout></RoleRoute>} />
          <Route path="/capstone" element={<RoleRoute allowedRoles={['Pharmacist', 'Clinical Reviewer', 'Pharmacy Supervisor']}><AppLayout><CapstoneSummary /></AppLayout></RoleRoute>} />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={<RoleRoute allowedRoles={['Prescriber/Doctor', 'Doctor', 'Prescriber']}><DoctorLayout><DoctorDashboard /></DoctorLayout></RoleRoute>} />
          <Route path="/doctor/new-prescription" element={<RoleRoute allowedRoles={['Prescriber/Doctor', 'Doctor', 'Prescriber']}><DoctorLayout><NewPrescription /></DoctorLayout></RoleRoute>} />
          <Route path="/doctor/my-prescriptions" element={<RoleRoute allowedRoles={['Prescriber/Doctor', 'Doctor', 'Prescriber']}><DoctorLayout><MyPrescriptions /></DoctorLayout></RoleRoute>} />
          <Route path="/doctor/clarification-requests" element={<RoleRoute allowedRoles={['Prescriber/Doctor', 'Doctor', 'Prescriber']}><DoctorLayout><ClarificationRequests /></DoctorLayout></RoleRoute>} />
          <Route path="/doctor/sent-to-pharmacy" element={<RoleRoute allowedRoles={['Prescriber/Doctor', 'Doctor', 'Prescriber']}><DoctorLayout><SentToPharmacy /></DoctorLayout></RoleRoute>} />
          <Route path="/doctor/resolved" element={<RoleRoute allowedRoles={['Prescriber/Doctor', 'Doctor', 'Prescriber']}><DoctorLayout><Resolved /></DoctorLayout></RoleRoute>} />
          <Route path="/doctor/notifications" element={<RoleRoute allowedRoles={['Prescriber/Doctor', 'Doctor', 'Prescriber']}><DoctorLayout><Notifications /></DoctorLayout></RoleRoute>} />
          <Route path="/doctor/profile" element={<RoleRoute allowedRoles={['Prescriber/Doctor', 'Doctor', 'Prescriber']}><DoctorLayout><Profile /></DoctorLayout></RoleRoute>} />

          {/* Dynamic Fallback */}
          <Route path="*" element={<ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
