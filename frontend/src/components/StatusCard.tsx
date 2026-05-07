import type { StatusEntry } from '../types'

interface Props {
  entry: StatusEntry
  eventCount: number
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const STATUS_CONFIG = {
  healthy: { dot: 'bg-green-500',  badge: 'bg-green-900 text-green-300',   label: 'Healthy'  },
  warning: { dot: 'bg-yellow-400', badge: 'bg-yellow-900 text-yellow-300', label: 'Warning'  },
  critical:{ dot: 'bg-red-500',    badge: 'bg-red-900 text-red-300',       label: 'Critical' },
}

export function StatusCard({ entry, eventCount }: Props) {
  const { dot, badge, label } = STATUS_CONFIG[entry.status]
  const cfg = entry.task_config

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${dot} shrink-0`} />
          <span className="text-white font-semibold text-sm truncate">{entry.device_id}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
      </div>

      <div className="text-gray-400 text-xs font-mono truncate">{entry.task}</div>

      {cfg && (
        <div className="text-gray-500 text-xs flex flex-wrap gap-x-3 gap-y-1">
          {cfg.cron && (
            <span title="Cron schedule" className="font-mono">{cfg.cron}</span>
          )}
          {(cfg.warning_hours !== undefined || cfg.critical_hours !== undefined) && (
            <span>
              {cfg.warning_hours ?? 24}h / {cfg.critical_hours ?? 72}h
            </span>
          )}
        </div>
      )}

      <div className="text-gray-500 text-xs flex items-center justify-between pt-1 border-t border-gray-700">
        <span>Last event: {timeAgo(entry.last_event.timestamp)}</span>
        <span>{eventCount} events</span>
      </div>
    </div>
  )
}
