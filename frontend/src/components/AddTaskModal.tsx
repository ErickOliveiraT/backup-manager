import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createTask } from '../services/api'
import type { Device } from '../types'

interface Props {
  devices: Device[]
  onClose: () => void
  onSuccess: () => void
}

export function AddTaskModal({ devices, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ device_id: '', task: '', cron: '', warning_hours: '', critical_hours: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createTask({
        device_id: form.device_id,
        task: form.task.trim(),
        ...(form.cron.trim() && { cron: form.cron.trim() }),
        ...(form.warning_hours !== '' && { warning_hours: Number(form.warning_hours) }),
        ...(form.critical_hours !== '' && { critical_hours: Number(form.critical_hours) }),
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'bg-gray-900 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1f2e] border border-[#2a3040] rounded-2xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Add Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 text-xs">Device</label>
            <select
              value={form.device_id}
              onChange={(e) => setForm((f) => ({ ...f, device_id: e.target.value }))}
              required
              autoFocus
              className="bg-gray-900 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select device…</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name || d.id}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 text-xs">Task name</label>
            <input
              type="text"
              placeholder="e.g. documents-backup"
              value={form.task}
              onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
              required
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 text-xs">
              Cron <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="0 2 * * *"
              value={form.cron}
              onChange={(e) => setForm((f) => ({ ...f, cron: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-gray-400 text-xs">
                Warning (h) <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="number"
                placeholder="24"
                value={form.warning_hours}
                onChange={(e) => setForm((f) => ({ ...f, warning_hours: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-gray-400 text-xs">
                Critical (h) <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="number"
                placeholder="72"
                value={form.critical_hours}
                onChange={(e) => setForm((f) => ({ ...f, critical_hours: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-200 px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
            >
              {saving ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
