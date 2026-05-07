import { useEffect, useState, useCallback } from 'react'
import { fetchStatus, fetchDevices, fetchEvents } from '../services/api'
import { usePolling } from '../hooks/usePolling'
import { StatusCard } from '../components/StatusCard'
import type { StatusEntry, Device, BackupEvent } from '../types'

export function Dashboard() {
  const [statusList, setStatusList] = useState<StatusEntry[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [events, setEvents] = useState<BackupEvent[]>([])
  const [filterDevice, setFilterDevice] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const refreshStatus = useCallback(async () => {
    try {
      const data = await fetchStatus()
      setStatusList(data)
    } catch (err) {
      console.error('Failed to fetch status', err)
    }
  }, [])

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
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  usePolling(refreshStatus, 10_000)

  const eventCountByDevice = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.device_id] = (acc[e.device_id] ?? 0) + 1
    return acc
  }, {})

  const filtered = statusList.filter((entry) => {
    if (filterDevice && entry.device_id !== filterDevice) return false
    if (filterStatus && entry.status !== filterStatus) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-white text-2xl font-bold">Backup Status</h1>
        <div className="flex gap-3 flex-wrap">
          <select
            value={filterDevice}
            onChange={(e) => setFilterDevice(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All devices</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || d.id}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No backup tasks found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry) => (
            <StatusCard
              key={`${entry.device_id}:${entry.task}`}
              entry={entry}
              eventCount={eventCountByDevice[entry.device_id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
