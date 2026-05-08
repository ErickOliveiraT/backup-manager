import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { fetchEvents, fetchDevices, deleteEvent } from '../services/api'
import type { BackupEvent, Device } from '../types'

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EventsPage() {
  const [events, setEvents] = useState<BackupEvent[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceFilter, setDeviceFilter] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async (filter = deviceFilter) => {
    const [evs, devs] = await Promise.all([
      fetchEvents(filter || undefined),
      fetchDevices(),
    ])
    const sorted = [...evs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    setEvents(sorted)
    setDevices(devs)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleFilterChange = (value: string) => {
    setDeviceFilter(value)
    setConfirmingId(null)
    setLoading(true)
    load(value)
  }

  const handleDeleteConfirm = async (id: string) => {
    await deleteEvent(id)
    setConfirmingId(null)
    await load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-white text-2xl font-bold">Events</h1>
        <select
          value={deviceFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All devices</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>{d.name || d.id}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-sm">No events found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-700">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) =>
                confirmingId === ev.id ? (
                  <tr key={ev.id} className="bg-red-950/40">
                    <td colSpan={5} className="px-4 py-3 text-sm text-gray-300">
                      Delete event <span className="text-white font-medium">{ev.task}</span> from{' '}
                      <span className="text-indigo-400 font-mono">{ev.device_id}</span>? This cannot be undone.
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleDeleteConfirm(ev.id)}
                          className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={ev.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}>
                    <td className="px-4 py-3">
                      {ev.status === 'success' ? (
                        <span className="flex items-center gap-1.5 text-green-400">
                          <CheckCircle size={14} />
                          <span className="text-xs font-medium">success</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400">
                          <XCircle size={14} />
                          <span className="text-xs font-medium">error</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-400 text-xs">{ev.device_id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{ev.task}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{ev.source}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">{formatTimestamp(ev.timestamp)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirmingId(ev.id)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
