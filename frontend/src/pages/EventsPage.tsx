import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { fetchEvents, fetchDevices, deleteEvent } from '../services/api'
import type { EventFilters } from '../services/api'
import { useLastUpdated } from '../context/LastUpdatedContext'
import { TableSkeleton } from '../components/Skeleton'
import type { BackupEvent, Device } from '../types'

const LIMIT = 12

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Filters = { status: string; device_id: string; date_from: string; date_to: string }
const EMPTY_FILTERS: Filters = { status: '', device_id: '', date_from: '', date_to: '' }

const inputClass =
  'bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500'

function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number
  pages: number
  total: number
  onPage: (p: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1
  const to = Math.min(page * LIMIT, total)

  const nums: (number | '...')[] = []
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i)
  } else {
    nums.push(1)
    if (page > 3) nums.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i)
    if (page < pages - 2) nums.push('...')
    nums.push(pages)
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-1">
      <span className="text-gray-500 text-xs">
        {total === 0 ? '0 events' : `${from}–${to} of ${total} events`}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="px-2 py-1 text-xs rounded text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>
          {nums.map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="px-1 text-gray-600 text-xs">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`w-7 h-7 text-xs rounded transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            className="px-2 py-1 text-xs rounded text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}

export function EventsPage() {
  const [events, setEvents] = useState<BackupEvent[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [debouncedFilters, setDebouncedFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { setRefresh } = useLastUpdated()

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilters(filters)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [filters])

  const load = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    const apiFilters: EventFilters = {
      device_id: f.device_id || undefined,
      status: f.status || undefined,
      date_from: f.date_from || undefined,
      date_to: f.date_to || undefined,
      page: p,
      limit: LIMIT,
    }
    const [result, devs] = await Promise.all([fetchEvents(apiFilters), fetchDevices()])
    setEvents(result.data)
    setPagination({ total: result.total, pages: result.pages })
    setDevices(devs)
    setLoading(false)
  }, [])

  useEffect(() => {
    load(debouncedFilters, page)
  }, [load, debouncedFilters, page])

  useEffect(() => {
    setRefresh(() => load(debouncedFilters, page))
  }, [setRefresh, load, debouncedFilters, page])

  const setFilter = (key: keyof Filters) => (value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setConfirmingId(null)
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setConfirmingId(null)
  }

  const handleDeleteConfirm = async (id: string) => {
    await deleteEvent(id)
    setConfirmingId(null)
    await load(debouncedFilters, page)
  }

  const hasFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-4">
      <h1 className="text-white text-2xl font-bold">Events</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filters.status}
          onChange={(e) => setFilter('status')(e.target.value)}
          className={inputClass}
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>

        <select
          value={filters.device_id}
          onChange={(e) => setFilter('device_id')(e.target.value)}
          className={inputClass}
        >
          <option value="">All devices</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name || d.id}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilter('date_from')(e.target.value)}
          className={`${inputClass} [color-scheme:dark]`}
          title="From date"
        />

        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilter('date_to')(e.target.value)}
          className={`${inputClass} [color-scheme:dark]`}
          title="To date"
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 px-2 py-2 rounded transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton cols={6} />
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-sm">
          {hasFilters ? 'No events match the selected filters.' : 'No events found.'}
        </p>
      ) : (
        <>
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
                        <span className="text-indigo-400 font-mono">{ev.device_id}</span>? This cannot
                        be undone.
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
                      <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">
                        {formatTimestamp(ev.timestamp)}
                      </td>
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
          <Pagination
            page={page}
            pages={pagination.pages}
            total={pagination.total}
            onPage={setPage}
          />
        </>
      )}
    </div>
  )
}
