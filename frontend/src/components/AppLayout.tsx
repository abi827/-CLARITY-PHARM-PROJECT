import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ListChecks, FileText, Users, BarChart2, FlaskConical,
  AlertOctagon, ShieldAlert, MessageSquare, BookOpen, ShieldCheck, ScrollText,
  Settings, LogOut, Activity, Bell, ChevronLeft, ChevronRight, Menu
} from 'lucide-react'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { path: '/priority-queue', label: 'Priority Queue', icon: ListChecks, roles: null },
  { path: '/clarifications', label: 'Clarifications', icon: FileText, roles: null },
  { path: '/patient-journeys', label: 'Patient Journeys', icon: Users, roles: null },
  { path: '/analytics', label: 'Analytics', icon: BarChart2, roles: null },
  { path: '/experiments', label: 'Experiments', icon: FlaskConical, roles: ['Clinical Reviewer', 'Pharmacy Supervisor'] },
  { path: '/error-analysis', label: 'Error Analysis', icon: AlertOctagon, roles: ['Clinical Reviewer', 'Pharmacy Supervisor'] },
  { path: '/failure-cases', label: 'Failure Cases', icon: ShieldAlert, roles: ['Clinical Reviewer', 'Pharmacy Supervisor'] },
  { path: '/stakeholder-feedback', label: 'Stakeholder Feedback', icon: MessageSquare, roles: ['Clinical Reviewer', 'Pharmacy Supervisor'] },
  { path: '/documentation', label: 'Technical Docs', icon: BookOpen, roles: ['Clinical Reviewer', 'Pharmacy Supervisor'] },
  { path: '/responsible-ai', label: 'Responsible AI', icon: ShieldCheck, roles: ['Clinical Reviewer', 'Pharmacy Supervisor'] },
  { path: '/audit-log', label: 'Audit Log', icon: ScrollText, roles: ['Clinical Reviewer', 'Pharmacy Supervisor'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: null },
  { path: '/capstone', label: 'Capstone Summary', icon: Activity, roles: ['Clinical Reviewer', 'Pharmacy Supervisor'] },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const initial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-tr from-green-600 to-green-400 rounded-lg flex items-center justify-center shrink-0">
            <Activity className="text-white w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 leading-tight">CLARITY-PHARM</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-tight">Prioritiser</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {NAV.filter(({ roles }) => !roles || roles.includes(user?.role || '')).map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-green-600' : ''}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-gray-200 p-2 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                {initial}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name || user?.email}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Sign Out'}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 rounded-lg transition-colors mt-1"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              {NAV.find(n => n.path === location.pathname)?.label || 'CLARITY-PHARM'}
            </h1>
            <p className="text-xs text-gray-400">AI-Assisted Prescription Clarification Prioritisation</p>
          </div>

          <div className="flex items-center gap-4">

            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.email}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
                <p className="text-[10px] text-gray-500 font-mono tracking-wide">ID: {user?.id}</p>
              </div>
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm border border-green-200">
                {initial}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-screen-2xl mx-auto">
            {/* Safety banner */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-700 font-medium">
              ⚕️ AI prioritisation is decision-support only. A qualified pharmacist must review high-priority clarifications before action.
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
