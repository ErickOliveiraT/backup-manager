import { CheckCircle, XCircle } from 'lucide-react'
import type { BackupEvent, Device } from '../types'

interface RecentEventsListProps {
  events: BackupEvent[]
  devices: Device[]
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

export function RecentEventsList({ events, devices }: RecentEventsListProps) {
  const deviceMap = new Map(devices.map((d) => [d.id, d.name || d.id]))

  const recent = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return (
    <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-5 flex flex-col gap-4">
      <h3 className="text-white text-sm font-semibold">Recent events</h3>
      <div className="flex flex-col gap-3 overflow-y-auto">
        {recent.length === 0 ? (
          <p className="text-gray-600 text-xs">No events recorded.</p>
        ) : (
          recent.map((event) => (
            <div key={event.id} className="flex items-start gap-3">
              {event.status === 'success' ? (
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">
                  {deviceMap.get(event.device_id) ?? event.device_id}
                </div>
                <div className="text-gray-500 text-xs truncate">{event.task}</div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span className="text-gray-500 text-xs">{timeAgo(event.timestamp)}</span>
                <span className="text-gray-700 text-xs">{event.source}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
