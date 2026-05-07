import { useEffect, useState } from 'react'
import { fetchDevices, createDevice } from '../services/api'
import type { Device } from '../types'

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [form, setForm] = useState({ id: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setDevices(await fetchDevices())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createDevice(form)
      setForm({ id: '', name: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create device')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
      <section>
        <h1 className="text-white text-2xl font-bold mb-4">Devices</h1>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
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
                </tr>
              </thead>
              <tbody>
                {devices.map((d, i) => (
                  <tr
                    key={d.id}
                    className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}
                  >
                    <td className="px-4 py-3 font-mono text-indigo-400">{d.id}</td>
                    <td className="px-4 py-3">{d.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
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
          {error && <p className="text-red-400 text-xs">{error}</p>}
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
