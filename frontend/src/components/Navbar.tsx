import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Shield, Moon, RefreshCw } from 'lucide-react'
import { useLastUpdated } from '../context/LastUpdatedContext'

function relativeTime(date: Date | null): string {
  if (!date) return '—'
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `há ${diff}s`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `há ${mins}min`
  return `há ${Math.floor(mins / 60)}h`
}

const activeLinkClass = 'bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors'
const inactiveLinkClass = 'text-gray-400 hover:bg-[#2a3040] hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors'
const disabledLinkClass = 'text-gray-600 px-3 py-1.5 rounded-md text-sm font-medium cursor-not-allowed'

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
              Dispositivos
            </NavLink>
            <NavLink to="/tasks" className={linkClass}>
              Tarefas
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-xs">
          <button className="hover:text-white transition-colors">
            <Moon size={16} />
          </button>
          <span>Última atualização: {relativeTime(lastUpdated)}</span>
          <button className="hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
