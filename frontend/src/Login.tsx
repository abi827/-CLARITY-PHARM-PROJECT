import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle } from 'lucide-react'
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
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pharmacy-50 via-white to-pharmacy-100 z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pharmacy-500/20 rounded-full blur-3xl z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl z-0"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-pharmacy-600 to-pharmacy-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-pharmacy-500/30">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">CLARITY-PHARM</h1>
          <p className="text-sm text-gray-500 mt-1">Prescription Clarification Prioritiser</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 pl-1">Pharmacy ID / Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 pl-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-pharmacy-600 focus:ring-pharmacy-500" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-pharmacy-600 font-medium hover:text-pharmacy-700">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pharmacy-600 to-pharmacy-500 hover:from-pharmacy-700 hover:to-pharmacy-600 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 transition-all active:scale-[0.98]"
          >
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">Don't have an account? </span>
          <Link to="/signup" className="text-pharmacy-600 font-semibold hover:text-pharmacy-700">Sign Up</Link>
        </div>

      </div>
    </div>
  )
}
