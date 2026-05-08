import { useEffect, useState, useCallback } from 'react'
import { fetchTasks, fetchDevices, createTask, updateTask, deleteTask } from '../services/api'
import { useLastUpdated } from '../context/LastUpdatedContext'
import { TableSkeleton } from '../components/Skeleton'
import { WebhookModal } from '../components/WebhookModal'
import type { Task, Device } from '../types'

interface EditState {
  cron: string
  warning_hours: string
  critical_hours: string
}

function taskKey(t: Task) {
  return t.id
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [webhookTask, setWebhookTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState<EditState>({ cron: '', warning_hours: '', critical_hours: '' })
  const [addForm, setAddForm] = useState({ device_id: '', task: '', cron: '', warning_hours: '', critical_hours: '' })
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [editError, setEditError] = useState('')
  const [addError, setAddError] = useState('')
  const [loading, setLoading] = useState(true)
  const [deviceFilter, setDeviceFilter] = useState('')
  const { setRefresh } = useLastUpdated()

  const load = useCallback(async () => {
    const [t, d] = await Promise.all([fetchTasks(), fetchDevices()])
    setTasks(t)
    setDevices(d)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setRefresh(load) }, [setRefresh, load])

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditError('')
    setEditForm({
      cron: task.cron ?? '',
      warning_hours: task.warning_hours !== undefined ? String(task.warning_hours) : '',
      critical_hours: task.critical_hours !== undefined ? String(task.critical_hours) : '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError('')
  }

  const saveEdit = async (id: string) => {
    setEditError('')
    const patch: { cron?: string | null; warning_hours?: number | null; critical_hours?: number | null } = {
      cron: editForm.cron.trim() || null,
      warning_hours: editForm.warning_hours !== '' ? Number(editForm.warning_hours) : null,
      critical_hours: editForm.critical_hours !== '' ? Number(editForm.critical_hours) : null,
    }
    try {
      await updateTask(id, patch)
      setEditingId(null)
      await load()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleDeleteConfirm = async (id: string) => {
    await deleteTask(id)
    setConfirmingId(null)
    await load()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    try {
      await createTask({
        device_id: addForm.device_id,
        task: addForm.task.trim(),
        ...(addForm.cron.trim() && { cron: addForm.cron.trim() }),
        ...(addForm.warning_hours !== '' && { warning_hours: Number(addForm.warning_hours) }),
        ...(addForm.critical_hours !== '' && { critical_hours: Number(addForm.critical_hours) }),
      })
      setAddForm({ device_id: '', task: '', cron: '', warning_hours: '', critical_hours: '' })
      await load()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  const inputCls = 'bg-gray-900 border border-gray-600 text-gray-200 text-xs rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600'

  const filteredTasks = deviceFilter ? tasks.filter((t) => t.device_id === deviceFilter) : tasks

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
      <section>
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h1 className="text-white text-2xl font-bold">Tasks</h1>
          {!loading && devices.length > 0 && (
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All devices</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name || d.id}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <TableSkeleton cols={6} />
        ) : filteredTasks.length === 0 ? (
          <p className="text-gray-500 text-sm">{tasks.length === 0 ? 'No tasks found. They are created automatically when a webhook arrives, or manually below.' : 'No tasks for this device.'}</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-700">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Cron</th>
                  <th className="px-4 py-3">Warn (h)</th>
                  <th className="px-4 py-3">Crit (h)</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t, i) => (
                  confirmingId === t.id ? (
                    <tr key={taskKey(t)} className="bg-red-950/40">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-red-300 text-xs">
                            Delete task <span className="font-mono text-red-200">{t.task}</span> from <span className="font-mono text-red-200">{t.device_id}</span>? This cannot be undone.
                          </span>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleDeleteConfirm(t.id)}
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
                  ) : editingId === t.id ? (
                    <tr key={taskKey(t)} className="bg-gray-700/60">
                      <td className="px-4 py-2 font-mono text-indigo-400 text-xs">{t.device_id}</td>
                      <td className="px-4 py-2 font-mono text-xs">{t.task}</td>
                      <td className="px-3 py-2">
                        <input
                          placeholder="e.g. 0 2 * * *"
                          value={editForm.cron}
                          onChange={(e) => setEditForm((f) => ({ ...f, cron: e.target.value }))}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          placeholder="default"
                          value={editForm.warning_hours}
                          onChange={(e) => setEditForm((f) => ({ ...f, warning_hours: e.target.value }))}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          placeholder="default"
                          value={editForm.critical_hours}
                          onChange={(e) => setEditForm((f) => ({ ...f, critical_hours: e.target.value }))}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(t.id)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors">Save</button>
                            <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded transition-colors">Cancel</button>
                          </div>
                          {editError && <span className="text-red-400 text-xs">{editError}</span>}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={taskKey(t)} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}>
                      <td className="px-4 py-3 font-mono text-indigo-400 text-xs">{t.device_id}</td>
                      <td className="px-4 py-3 font-mono text-xs">{t.task}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.cron ?? <span className="text-gray-600">—</span>}</td>
                      <td className="px-4 py-3">{t.warning_hours !== undefined ? t.warning_hours : <span className="text-gray-600">default</span>}</td>
                      <td className="px-4 py-3">{t.critical_hours !== undefined ? t.critical_hours : <span className="text-gray-600">default</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => setWebhookTask(t)} className="text-xs text-gray-400 hover:text-gray-200 transition-colors">Payload</button>
                          <button onClick={() => startEdit(t)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Edit</button>
                          <button onClick={() => setConfirmingId(t.id)} className="text-xs text-red-500 hover:text-red-400 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-white text-lg font-semibold mb-3">Add Task</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Device *</label>
            <select
              value={addForm.device_id}
              onChange={(e) => setAddForm((f) => ({ ...f, device_id: e.target.value }))}
              required
              className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select device...</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name || d.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Task name *</label>
            <input
              type="text"
              placeholder="e.g. documents-backup"
              value={addForm.task}
              onChange={(e) => setAddForm((f) => ({ ...f, task: e.target.value }))}
              required
              className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Cron <span className="text-gray-600">(optional)</span></label>
            <input
              type="text"
              placeholder="0 2 * * *"
              value={addForm.cron}
              onChange={(e) => setAddForm((f) => ({ ...f, cron: e.target.value }))}
              className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-gray-400 text-xs mb-1 block">Warn (h) <span className="text-gray-600">(optional)</span></label>
              <input
                type="number"
                placeholder="24"
                value={addForm.warning_hours}
                onChange={(e) => setAddForm((f) => ({ ...f, warning_hours: e.target.value }))}
                className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-xs mb-1 block">Crit (h) <span className="text-gray-600">(optional)</span></label>
              <input
                type="number"
                placeholder="72"
                value={addForm.critical_hours}
                onChange={(e) => setAddForm((f) => ({ ...f, critical_hours: e.target.value }))}
                className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {addError && <p className="text-red-400 text-xs sm:col-span-2">{addError}</p>}
          <div className="sm:col-span-2">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors">
              Add Task
            </button>
          </div>
        </form>
      </section>
    </div>

    {webhookTask && (
      <WebhookModal task={webhookTask} onClose={() => setWebhookTask(null)} />
    )}
    </>
  )
}
