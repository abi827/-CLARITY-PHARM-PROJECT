import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, User, Lock, Mail, ArrowRight, AlertCircle, CheckCircle, ChevronDown, Activity, Zap } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 overflow-hidden">
      <div className="text-center p-12 bg-white rounded-3xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Account Created!</h2>
        <p className="text-gray-500 font-medium">Redirecting to sign in...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel - Showcase (Reversed from Login) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center p-12 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1584982751601-97d8cb0f6669?q=80&w=2070&auto=format&fit=crop")' }}
        ></div>
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pharmacy-900/90 via-gray-900/95 to-gray-900 z-0"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] z-0 pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-xl text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 shadow-2xl">
            <Zap className="w-4 h-4 text-blue-300" />
            <span className="text-sm font-semibold tracking-wide text-blue-50">JOIN THE NETWORK</span>
          </div>
          
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Connect. Clarify. Resolve.
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-12">
            Join thousands of healthcare professionals using Clarity-Pharm to bridge the gap between prescribing and dispensing. Experience a seamless, secure, and rapid workflow.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="text-3xl font-bold text-white mb-1">10k+</h3>
              <p className="text-sm text-gray-400 font-medium">Prescriptions Clarified</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="text-3xl font-bold text-white mb-1">98%</h3>
              <p className="text-sm text-gray-400 font-medium">Resolution Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative overflow-hidden bg-white">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-pharmacy-100 rounded-full blur-[100px] opacity-60"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-pharmacy-600 to-pharmacy-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-pharmacy-500/30 transform transition hover:scale-105">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Create Account</h1>
            <p className="text-gray-500 text-lg">Join CLARITY-PHARM today.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50/80 border border-red-200 text-red-700 px-4 py-4 rounded-2xl text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-pharmacy-600">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-pharmacy-500 transition-colors" />
                </div>
                <input type="text" required value={form.name} onChange={set('name')}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="Dr. John Doe" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Work Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-pharmacy-600">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-pharmacy-500 transition-colors" />
                </div>
                <input type="email" required value={form.email} onChange={set('email')}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="john@hospital.org" />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Role</label>
              <div className="relative group">
                <select value={form.role} onChange={set('role')}
                  className="block w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-pharmacy-600">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-pharmacy-500 transition-colors" />
                  </div>
                  <input type="password" required value={form.password} onChange={set('password')}
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="Min 6 chars" />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Confirm</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-pharmacy-600">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-pharmacy-500 transition-colors" />
                  </div>
                  <input type="password" required value={form.confirm_password} onChange={set('confirm_password')}
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="••••••••" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pharmacy-600 to-pharmacy-500 hover:from-pharmacy-700 hover:to-pharmacy-600 disabled:opacity-70 text-white font-bold py-4 px-4 rounded-2xl shadow-xl shadow-pharmacy-500/25 transition-all active:scale-[0.98] mt-6">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 animate-pulse" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span>Sign Up Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500 font-medium">Already have an account? </span>
            <Link to="/login" className="text-pharmacy-600 font-bold hover:text-pharmacy-800 transition-colors ml-1">Sign In here</Link>
          </div>

        </div>
      </div>
    </div>
  )
}
