import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { fetchDevicesPaginated, updateDevice, deleteDevice } from '../services/api'
import { useLastUpdated } from '../context/LastUpdatedContext'
import { TableSkeleton } from '../components/Skeleton'
import { AddDeviceModal } from '../components/AddDeviceModal'
import type { Device, PaginatedDevices } from '../types'

const LIMIT = 10

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
        {total === 0 ? '0 devices' : `${from}–${to} of ${total} devices`}
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
              <span key={`e${i}`} className="px-1 text-gray-600 text-xs">…</span>
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

export function DevicesPage() {
  const [paginated, setPaginated] = useState<PaginatedDevices>({ data: [], total: 0, page: 1, pages: 1 })
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { setRefresh } = useLastUpdated()

  const load = useCallback(async (p: number) => {
    try {
      setPaginated(await fetchDevicesPaginated(p, LIMIT))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [load, page])
  useEffect(() => { setRefresh(() => load(page)) }, [setRefresh, load, page])

  const startEdit = (device: Device) => {
    setEditingId(device.id)
    setEditName(device.name)
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError('')
  }

  const handleDeleteConfirm = async (id: string) => {
    await deleteDevice(id)
    setConfirmingId(null)
    await load(page)
  }

  const saveEdit = async (id: string) => {
    setEditError('')
    try {
      await updateDevice(id, editName.trim())
      setEditingId(null)
      await load(page)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const inputCls = 'bg-gray-900 border border-gray-600 text-gray-200 text-xs rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600'
  const devices = paginated.data

  return (
    <>
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl font-bold">Devices</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md px-3 py-2 transition-colors"
          >
            <Plus size={15} />
            Add Device
          </button>
        </div>
        {loading ? (
          <TableSkeleton cols={4} />
        ) : devices.length === 0 && paginated.total === 0 ? (
          <p className="text-gray-500 text-sm">No devices registered.</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-700 mb-3">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d, i) =>
                    editingId === d.id ? (
                      <tr key={d.id} className="bg-gray-700/60">
                        <td className="px-4 py-2 font-mono text-indigo-400 text-xs">{d.id}</td>
                        <td className="px-3 py-2">
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(d.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            className={inputCls}
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(d.id)}
                                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                            {editError && <span className="text-red-400 text-xs">{editError}</span>}
                          </div>
                        </td>
                      </tr>
                    ) : confirmingId === d.id ? (
                      <tr key={d.id} className="bg-red-950/40">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-red-300 text-xs">
                              Delete device <span className="font-mono text-red-200">{d.id}</span>? This cannot be undone.
                            </span>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleDeleteConfirm(d.id)}
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
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={d.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}>
                        <td className="px-4 py-3 font-mono text-indigo-400 text-xs">{d.id}</td>
                        <td className="px-4 py-3">{d.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(d)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmingId(d.id)}
                              className="text-xs text-red-500 hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={paginated.page}
              pages={paginated.pages}
              total={paginated.total}
              onPage={setPage}
            />
          </>
        )}
      </section>
    </div>

    {showAddModal && (
      <AddDeviceModal
        onClose={() => setShowAddModal(false)}
        onSuccess={() => load(page)}
      />
    )}
    </>
  )
}
