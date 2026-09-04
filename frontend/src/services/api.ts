import axios from 'axios'

const BASE = 'http://localhost:8000/api'

const api = axios.create({ baseURL: BASE })

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  signup: (data: { name: string; email: string; password: string; confirm_password: string; role: string }) =>
    api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// Clarifications
export const clarAPI = {
  list: (params?: any) => api.get('/clarifications', { params }),
  get: (id: number) => api.get(`/clarifications/${id}`),
  review: (id: number, body: any) => api.post(`/clarifications/${id}/review`, body),
  resolve: (id: number, body: any) => api.post(`/clarifications/${id}/resolve`, body),
}

// Pharmacist Prescriptions
export const pharmacyRxAPI = {
  list: () => api.get('/prescriptions'),
  clarify: (id: string, question: string) => api.post(`/prescriptions/${id}/clarify`, { pharmacist_question: question }),
}

// Dashboard
export const dashAPI = {
  get: () => api.get('/dashboard'),
}

// Analytics
export const analyticsAPI = {
  get: () => api.get('/analytics'),
}

// Experiments
export const expAPI = {
  run: (config: any) => api.post('/experiments/run', config),
  latest: () => api.get('/experiments/latest'),
}

// Audit Log
export const auditAPI = {
  list: () => api.get('/audit-log'),
}

// Feedback
export const feedbackAPI = {
  submit: (body: any) => api.post('/feedback', body),
  summary: () => api.get('/feedback/summary'),
}

// Patient Journeys
export const journeyAPI = {
  list: () => api.get('/patient-journeys'),
}

// Failure Cases
export const failureAPI = {
  list: () => api.get('/failure-cases'),
}

// Settings
export const settingsAPI = {
  getThresholds: () => api.get('/settings/thresholds'),
  updateThresholds: (body: any) => api.post('/settings/thresholds', body),
}

// Model Metrics
export const modelAPI = {
  metrics: () => api.get('/model/metrics'),
}

// Doctor API
export const doctorAPI = {
  dashboard: () => api.get('/doctor/dashboard'),
  medicines: () => api.get('/doctor/medicines'),
  patientIds: () => api.get('/doctor/patient-ids'),
  createPrescription: (body: any) => api.post('/doctor/prescriptions', body),
  listPrescriptions: (status?: string) => api.get('/doctor/prescriptions', { params: status ? { status } : {} }),
  getPrescription: (id: string) => api.get(`/doctor/prescriptions/${id}`),
  sendToPharmacy: (id: string) => api.patch(`/doctor/prescriptions/${id}/send`),
  listClarifications: () => api.get('/doctor/clarifications'),
  respondToClarification: (id: number, body: { response_text: string }) => api.post(`/doctor/clarifications/${id}/respond`, body),
  listNotifications: () => api.get('/doctor/notifications'),
  markNotifRead: (id: number) => api.patch(`/doctor/notifications/${id}/read`),
  markAllNotifsRead: () => api.patch('/doctor/notifications/read-all'),
}

export default api
