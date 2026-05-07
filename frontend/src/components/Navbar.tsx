import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Shield, RefreshCw } from 'lucide-react'
import { useLastUpdated } from '../context/LastUpdatedContext'

function relativeTime(date: Date | null): string {
  if (!date) return '—'
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

const activeLinkClass = 'bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors'
const inactiveLinkClass = 'text-gray-400 hover:bg-[#2a3040] hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors'

export function Navbar() {
  const { lastUpdated } = useLastUpdated()
  const [, forceRender] = useState(0)

  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

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
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-xs">
          <span>Last updated: {relativeTime(lastUpdated)}</span>
          <button className="hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
