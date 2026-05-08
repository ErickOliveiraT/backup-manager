import { useEffect, useState, useCallback } from 'react'
import { fetchDevices, createDevice, updateDevice } from '../services/api'
import { useLastUpdated } from '../context/LastUpdatedContext'
import { TableSkeleton } from '../components/Skeleton'
import type { Device } from '../types'

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [form, setForm] = useState({ id: '', name: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [addError, setAddError] = useState('')
  const [loading, setLoading] = useState(true)
  const { setRefresh } = useLastUpdated()

  const load = useCallback(async () => {
    try {
      setDevices(await fetchDevices())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setRefresh(load) }, [setRefresh, load])

  const startEdit = (device: Device) => {
    setEditingId(device.id)
    setEditName(device.name)
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError('')
  }

  const saveEdit = async (id: string) => {
    setEditError('')
    try {
      await updateDevice(id, editName.trim())
      setEditingId(null)
      await load()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    try {
      await createDevice(form)
      setForm({ id: '', name: '' })
      await load()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create device')
    }
  }

  const inputCls = 'bg-gray-900 border border-gray-600 text-gray-200 text-xs rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
      <section>
        <h1 className="text-white text-2xl font-bold mb-4">Devices</h1>
        {loading ? (
          <TableSkeleton cols={4} />
        ) : devices.length === 0 ? (
          <p className="text-gray-500 text-sm">No devices registered.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-700">
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
                  ) : (
                    <tr key={d.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}>
                      <td className="px-4 py-3 font-mono text-indigo-400 text-xs">{d.id}</td>
                      <td className="px-4 py-3">{d.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => startEdit(d)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-white text-lg font-semibold mb-3">Add Device</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
          <input
            type="text"
            placeholder="Device ID (e.g. notebook-linux-1)"
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            required
            className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Display name (e.g. Notebook Linux)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {addError && <p className="text-red-400 text-xs">{addError}</p>}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
          >
            Add Device
          </button>
        </form>
      </section>
    </div>
  )
}
