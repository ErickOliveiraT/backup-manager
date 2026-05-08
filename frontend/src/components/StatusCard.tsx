import { FileText } from 'lucide-react'
import type { StatusEntry } from '../types'

interface Props {
  entry: StatusEntry
  eventCount: number
  deviceName?: string
  compact?: boolean
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const STATUS_CONFIG = {
  healthy:  { dot: 'bg-green-500',  bar: 'bg-green-500',  badge: 'bg-green-500/10 text-green-400',   label: 'Healthy'  },
  warning:  { dot: 'bg-yellow-400', bar: 'bg-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400', label: 'Warning'  },
  critical: { dot: 'bg-red-500',    bar: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400',       label: 'Critical' },
}

export function StatusCard({ entry, eventCount, deviceName, compact = false }: Props) {
  const displayName = deviceName ?? entry.device_id
  const { dot, bar, badge, label } = STATUS_CONFIG[entry.status]
  const cfg = entry.task_config

  if (compact) {
    return (
      <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl px-4 py-3 flex items-center gap-4 overflow-hidden relative">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />
        <div className="flex items-center gap-2 pl-2 min-w-0 flex-1">
          <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
          <span className="text-white font-semibold text-sm truncate">{displayName}</span>
          <span className="text-gray-600 text-xs">·</span>
          <span className="text-gray-400 text-xs font-mono truncate">{entry.task}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge}`}>{label}</span>
        <span className="text-gray-500 text-xs shrink-0">{timeAgo(entry.last_event.timestamp)}</span>
        <span className="text-gray-600 text-xs shrink-0">{eventCount} {eventCount === 1 ? 'event' : 'events'}</span>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl flex flex-col overflow-hidden">
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />
            <span className="text-white font-semibold text-sm truncate">{displayName}</span>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${badge}`}>{label}</span>
        </div>

        <div className="text-gray-400 text-xs font-mono truncate">{entry.task}</div>

        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <FileText size={12} className="shrink-0" />
          <span className="font-mono truncate">{cfg?.cron ?? '—'}</span>
          {cfg && (cfg.warning_hours !== undefined || cfg.critical_hours !== undefined) && (
            <span className="ml-auto shrink-0">{cfg.warning_hours ?? 24}h/{cfg.critical_hours ?? 72}h</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#2a3040] text-gray-500 text-xs">
          <span>{timeAgo(entry.last_event.timestamp)}</span>
          <span>{eventCount} {eventCount === 1 ? 'event' : 'events'}</span>
        </div>
      </div>
      <div className={`h-1 w-full ${bar}`} />
    </div>
  )
}
