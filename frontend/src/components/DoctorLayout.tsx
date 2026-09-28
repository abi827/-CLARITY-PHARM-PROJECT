import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FilePlus, FileText, FileQuestion, UploadCloud,
  CheckCircle, Bell, User as UserIcon, LogOut, ChevronLeft, ChevronRight, Activity, Stethoscope
} from 'lucide-react'

const NAV = [
  { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/doctor/new-prescription', label: 'New Prescription', icon: FilePlus },
  { path: '/doctor/my-prescriptions', label: 'My Prescriptions', icon: FileText },
  { path: '/doctor/clarification-requests', label: 'Clarification Requests', icon: FileQuestion },
  { path: '/doctor/sent-to-pharmacy', label: 'Sent to Pharmacy', icon: UploadCloud },
  { path: '/doctor/resolved', label: 'Resolved', icon: CheckCircle },
  { path: '/doctor/notifications', label: 'Notifications', icon: Bell },
  { path: '/doctor/profile', label: 'Profile', icon: UserIcon },
]

import { doctorAPI } from '../services/api'

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [pendingClars, setPendingClars] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)

  useEffect(() => {
    // Fetch live counts for badges
    doctorAPI.dashboard().then(res => {
      if (res.data) {
        setPendingClars(res.data.pending_clarifications || 0)
        setUnreadNotifs(res.data.unread_notifications || 0)
      }
    }).catch(() => {})
  }, [location.pathname])

  const initial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-tr from-teal-600 to-teal-400 rounded-lg flex items-center justify-center shrink-0">
            <Stethoscope className="text-white w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 leading-tight">CLARITY-PHARM</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-tight">Prescriber Dashboard</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            const badgeCount = path === '/doctor/clarification-requests' ? pendingClars : path === '/doctor/notifications' ? unreadNotifs : 0
            const badgeColor = path === '/doctor/clarification-requests' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'

            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-50 text-teal-700 border border-teal-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-teal-600' : ''}`} />
                  {collapsed && badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{label}</span>
                    {badgeCount > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                        {badgeCount}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-gray-200 p-2 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                {initial}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-gray-900 truncate">Dr. {user?.name || user?.email}</p>
                <p className="text-[10px] text-gray-400 truncate">Role: Prescriber</p>
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
              {NAV.find(n => n.path === location.pathname)?.label || 'Prescriber Dashboard'}
            </h1>
            <p className="text-xs text-gray-400">Prescription Clarification Prioritiser</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full relative" onClick={() => navigate('/doctor/notifications')}>
              <Bell className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 leading-tight">Dr. {user?.name}</p>
                <p className="text-xs text-gray-400">Prescriber</p>
              </div>
              <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm border border-teal-200">
                {initial}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
