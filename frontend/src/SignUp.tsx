import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, User, Lock, Mail, ArrowRight, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react'
import { useAuth } from './context/AuthContext'

const ROLES = ['Pharmacist', 'Prescriber/Doctor']

export default function SignUp() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '', role: 'Pharmacist' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await signup(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pharmacy-50 via-white to-pharmacy-100 z-0"></div>
      <div className="relative z-10 text-center p-8 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Account Created!</h2>
        <p className="text-gray-500 mt-2">Redirecting to sign in...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pharmacy-50 via-white to-pharmacy-100 z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pharmacy-500/20 rounded-full blur-3xl z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl z-0"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-pharmacy-600 to-pharmacy-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-pharmacy-500/30">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Join CLARITY-PHARM</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 pl-1">Full Name</label>
            <div className="relative">
              <User className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" required value={form.name} onChange={set('name')}
                className="block w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all"
                placeholder="Dr. John Doe" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 pl-1">Work Email</label>
            <div className="relative">
              <Mail className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="email" required value={form.email} onChange={set('email')}
                className="block w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all"
                placeholder="john@hospital.org" />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 pl-1">Role</label>
            <div className="relative">
              <select value={form.role} onChange={set('role')}
                className="block w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all appearance-none">
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 pl-1">Password</label>
            <div className="relative">
              <Lock className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="password" required value={form.password} onChange={set('password')}
                className="block w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all"
                placeholder="Min 6 characters" />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 pl-1">Confirm Password</label>
            <div className="relative">
              <Lock className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="password" required value={form.confirm_password} onChange={set('confirm_password')}
                className="block w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all"
                placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pharmacy-600 to-pharmacy-500 hover:from-pharmacy-700 hover:to-pharmacy-600 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 transition-all active:scale-[0.98] mt-2">
            {loading ? 'Creating Account...' : 'Sign Up'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">Already have an account? </span>
          <Link to="/login" className="text-pharmacy-600 font-semibold hover:text-pharmacy-700">Sign In</Link>
        </div>

      </div>
    </div>
  )
}
