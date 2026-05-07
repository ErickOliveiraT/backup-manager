import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Monitor, ListChecks, CheckCircle, AlertTriangle, XCircle, Clock,
  Grid2x2, List, Plus,
} from 'lucide-react'
import { fetchStatus, fetchDevices, fetchEvents } from '../services/api'
import { usePolling } from '../hooks/usePolling'
import { useLastUpdated } from '../context/LastUpdatedContext'
import { StatusCard } from '../components/StatusCard'
import { StatCard } from '../components/StatCard'
import { DonutChart } from '../components/DonutChart'
import { BarChart } from '../components/BarChart'
import { RecentEventsList } from '../components/RecentEventsList'
import type { StatusEntry, Device, BackupEvent } from '../types'

type ViewMode = 'grid' | 'list'

function timeAgoShort(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function Dashboard() {
  const [statusList, setStatusList] = useState<StatusEntry[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [events, setEvents] = useState<BackupEvent[]>([])
  const [filterDevice, setFilterDevice] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [loading, setLoading] = useState(true)
  const { setLastUpdated } = useLastUpdated()

  const refreshStatus = useCallback(async () => {
    try {
      const data = await fetchStatus()
      setStatusList(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch status', err)
    }
  }, [setLastUpdated])

  useEffect(() => {
    const init = async () => {
      try {
        const [statusData, devicesData, eventsData] = await Promise.all([
          fetchStatus(),
          fetchDevices(),
          fetchEvents(),
        ])
        setStatusList(statusData)
        setDevices(devicesData)
        setEvents(eventsData)
        setLastUpdated(new Date())
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [setLastUpdated])

  usePolling(refreshStatus, 10_000)

  const healthy = statusList.filter((e) => e.status === 'healthy').length
  const warnings = statusList.filter((e) => e.status === 'warning').length
  const criticals = statusList.filter((e) => e.status === 'critical').length
  const total = statusList.length
  const healthPct = total ? Math.round((healthy / total) * 100) : 0
  const warnPct = total ? Math.round((warnings / total) * 100) : 0
  const critPct = total ? Math.round((criticals / total) * 100) : 0
  const uniqueDeviceIds = new Set(statusList.map((e) => e.device_id))

  const latestEvent = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )[0]

  const eventCountByDevice = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.device_id] = (acc[e.device_id] ?? 0) + 1
    return acc
  }, {})

  const perDeviceData = devices.map((d) => ({
    name: d.name || d.id,
    healthy: statusList.filter((e) => e.device_id === d.id && e.status === 'healthy').length,
    warning: statusList.filter((e) => e.device_id === d.id && e.status === 'warning').length,
    critical: statusList.filter((e) => e.device_id === d.id && e.status === 'critical').length,
  }))

  const filtered = statusList.filter((entry) => {
    if (filterDevice && entry.device_id !== filterDevice) return false
    if (filterStatus && entry.status !== filterStatus) return false
    return true
  })

  const selectCls =
    'bg-[#1a1f2e] border border-[#2a3040] text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Visão geral dos backups</h1>
        <p className="text-gray-500 text-sm mt-1">
          Panorama da saúde dos backups em todos os dispositivos e tarefas
        </p>
      </div>

      {/* Filters + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterDevice}
          onChange={(e) => setFilterDevice(e.target.value)}
          className={selectCls}
        >
          <option value="">Todos os dispositivos</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name || d.id}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={selectCls}
        >
          <option value="">Todos os status</option>
          <option value="healthy">Saudável</option>
          <option value="warning">Atenção</option>
          <option value="critical">Crítico</option>
        </select>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-[#2a3040] hover:text-white'
            }`}
          >
            <Grid2x2 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-[#2a3040] hover:text-white'
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Monitor}
          label="Dispositivos"
          value={uniqueDeviceIds.size}
          sub={`Ativos: ${uniqueDeviceIds.size}`}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          icon={ListChecks}
          label="Tarefas"
          value={total}
          sub="Monitoradas"
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Saudáveis"
          value={healthy}
          sub={`${healthPct}%`}
          iconColor="text-green-400"
          iconBg="bg-green-500/10"
        />
        <StatCard
          icon={AlertTriangle}
          label="Atenção"
          value={warnings}
          sub={`${warnPct}%`}
          iconColor="text-yellow-400"
          iconBg="bg-yellow-500/10"
        />
        <StatCard
          icon={XCircle}
          label="Críticos"
          value={criticals}
          sub={`${critPct}%`}
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
        />
        <StatCard
          icon={Clock}
          label="Último backup"
          value={latestEvent ? `há ${timeAgoShort(latestEvent.timestamp)}` : '—'}
          sub="Mais recente"
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
      </div>

      {/* Cards grid / list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Carregando...</p>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((entry) => (
            <StatusCard
              key={`${entry.device_id}:${entry.task}`}
              entry={entry}
              eventCount={eventCountByDevice[entry.device_id] ?? 0}
            />
          ))}
          <Link
            to="/tasks"
            className="bg-[#1a1f2e] border-2 border-dashed border-[#2a3040] rounded-xl p-5
              flex flex-col items-center justify-center gap-2 text-gray-500
              hover:border-blue-600 hover:text-blue-400 transition-colors min-h-[160px]"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Adicionar tarefa</span>
            <span className="text-xs text-center">Monitore uma nova tarefa de backup</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((entry) => (
            <StatusCard
              key={`${entry.device_id}:${entry.task}`}
              entry={entry}
              eventCount={eventCountByDevice[entry.device_id] ?? 0}
              compact
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-gray-500 text-sm">Nenhuma tarefa encontrada.</p>
          )}
        </div>
      )}

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DonutChart healthy={healthy} warning={warnings} critical={criticals} />
        <BarChart data={perDeviceData} />
        <RecentEventsList events={events} devices={devices} />
      </div>
    </div>
  )
}
