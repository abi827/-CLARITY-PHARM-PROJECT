import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle, Activity, Sparkles } from 'lucide-react'
import { useAuth } from './context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await login(email, password)
      if (u?.role === 'Prescriber/Doctor' || u?.role === 'Doctor' || u?.role === 'Prescriber') {
        navigate('/doctor/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative overflow-hidden bg-white">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-pharmacy-100 rounded-full blur-[100px] opacity-60"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-50 rounded-full blur-[100px] opacity-60"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-10">
            <div className="w-14 h-14 bg-gradient-to-tr from-pharmacy-600 to-pharmacy-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-pharmacy-500/30 transform transition hover:scale-105">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-lg">Sign in to CLARITY-PHARM to continue.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50/80 border border-red-200 text-red-700 px-4 py-4 rounded-2xl text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Pharmacy ID / Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-pharmacy-600">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-pharmacy-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="name@hospital.org"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-pharmacy-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="peer w-5 h-5 appearance-none border border-gray-300 rounded-md checked:bg-pharmacy-600 checked:border-pharmacy-600 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-all cursor-pointer" />
                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors font-medium">Remember me</span>
              </label>
              <a href="#" className="text-pharmacy-600 font-semibold hover:text-pharmacy-700 transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pharmacy-600 to-pharmacy-500 hover:from-pharmacy-700 hover:to-pharmacy-600 disabled:opacity-70 text-white font-bold py-4 px-4 rounded-2xl shadow-xl shadow-pharmacy-500/25 transition-all active:scale-[0.98] mt-4"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 animate-pulse" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center text-sm">
            <span className="text-gray-500 font-medium">Don't have an account? </span>
            <Link to="/signup" className="text-pharmacy-600 font-bold hover:text-pharmacy-800 transition-colors ml-1">Create an account</Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center p-12 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1576091160550-2173ff9e5950?q=80&w=2070&auto=format&fit=crop")' }}
        ></div>
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-pharmacy-900/90 via-gray-900/95 to-gray-900 z-0"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-pharmacy-500/20 rounded-full blur-[120px] z-0 pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-xl text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 shadow-2xl">
            <Sparkles className="w-4 h-4 text-pharmacy-300" />
            <span className="text-sm font-semibold tracking-wide text-pharmacy-50">CLARITY-PHARM 2.0 IS LIVE</span>
          </div>
          
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Intelligent Prescription Clarification.
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-12">
            Streamline communication between pharmacists and prescribers. Prioritize urgent requests, reduce dispensing errors, and improve patient outcomes with our AI-powered triage system.
          </p>

          {/* Testimonial / Stats Card */}
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pharmacy-400 to-blue-500 opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-pharmacy-400/50 flex-shrink-0 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=100&auto=format&fit=crop" alt="Doctor" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="italic text-gray-200 mb-3 text-sm leading-relaxed">
                  "Clarity-Pharm has cut our prescription clarification time by over 40%. It's an indispensable tool for our clinical pharmacy team."
                </p>
                <h4 className="font-semibold text-white">Dr. Sarah Jenkins</h4>
                <span className="text-xs text-pharmacy-300">Lead Clinical Pharmacist, Metro Gen</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
