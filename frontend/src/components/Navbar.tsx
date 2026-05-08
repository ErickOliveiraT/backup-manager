import { useEffect, useState, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Shield, RefreshCw, LogOut } from 'lucide-react'
import { useLastUpdated } from '../context/LastUpdatedContext'
import { clearToken } from '../services/auth'

function relativeTime(date: Date | null): string {
  if (!date) return '—'
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const activeLinkClass = 'bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors'
const inactiveLinkClass = 'text-gray-400 hover:bg-[#2a3040] hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors'

export function Navbar() {
  const { lastUpdated, refresh } = useLastUpdated()
  const [, forceRender] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    clearToken()
    navigate('/login')
  }

  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const handleRefresh = useCallback(() => {
    setSpinning(true)
    refresh()
    setTimeout(() => setSpinning(false), 600)
  }, [refresh])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? activeLinkClass : inactiveLinkClass

  return (
    <nav className="bg-[#1a1f2e] border-b border-[#2a3040] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-blue-400" />
            <span className="text-white font-bold text-base tracking-tight">Backup Manager</span>
          </div>
          <div className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/devices" className={linkClass}>
              Devices
            </NavLink>
            <NavLink to="/tasks" className={linkClass}>
              Tasks
            </NavLink>
            <NavLink to="/events" className={linkClass}>
              Events
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-xs">
          <span>Last updated: {relativeTime(lastUpdated)}</span>
          <button onClick={handleRefresh} className="hover:text-white transition-colors">
            <RefreshCw size={14} className={spinning ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout} className="hover:text-white transition-colors" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
