import { v4 as uuidv4 } from 'uuid'
import { FieldValue } from 'firebase-admin/firestore'
import { tasksCol } from '../db/database.js'
import type { Task } from '../types.js'

export interface TaskFilters {
  device_id?: string
}

export interface PaginatedTasks {
  data: Task[]
  total: number
  page: number
  pages: number
}

export async function getTasks(): Promise<Task[]> {
  const snap = await tasksCol.get()
  return snap.docs.map((d) => d.data() as Task)
}

export async function getTasksPaginated(
  filters: TaskFilters = {},
  page = 1,
  limit = 25
): Promise<PaginatedTasks> {
  let tasks = await getTasks()

  if (filters.device_id) tasks = tasks.filter((t) => t.device_id === filters.device_id)

  tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const total = tasks.length
  const pages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, pages)
  const start = (safePage - 1) * limit

  return { data: tasks.slice(start, start + limit), total, page: safePage, pages }
}

export async function taskExists(deviceId: string, taskName: string): Promise<boolean> {
  const snap = await tasksCol
    .where('device_id', '==', deviceId)
    .where('task', '==', taskName)
    .limit(1)
    .get()
  return !snap.empty
}

type AddTaskPayload = Pick<Task, 'device_id' | 'task'> &
  Partial<Pick<Task, 'cron' | 'warning_hours' | 'critical_hours'>>

export async function addTask(payload: AddTaskPayload): Promise<Task> {
  const task: Task = {
    id: uuidv4(),
    device_id: payload.device_id,
    task: payload.task,
    ...(payload.cron !== undefined && { cron: payload.cron }),
    ...(payload.warning_hours !== undefined && { warning_hours: payload.warning_hours }),
    ...(payload.critical_hours !== undefined && { critical_hours: payload.critical_hours }),
    created_at: new Date().toISOString(),
  }
  await tasksCol.doc(task.id).set(task)
  return task
}

type PatchTaskPayload = Partial<{
  cron: string | null
  warning_hours: number | null
  critical_hours: number | null
}>

export async function updateTask(id: string, patch: PatchTaskPayload): Promise<Task | null> {
  const docRef = tasksCol.doc(id)
  const snap = await docRef.get()
  if (!snap.exists) return null

  const updates: Record<string, unknown> = {}
  if ('cron' in patch) {
    updates.cron = patch.cron === null ? FieldValue.delete() : patch.cron
  }
  if ('warning_hours' in patch) {
    updates.warning_hours = patch.warning_hours === null ? FieldValue.delete() : patch.warning_hours
  }
  if ('critical_hours' in patch) {
    updates.critical_hours = patch.critical_hours === null ? FieldValue.delete() : patch.critical_hours
  }

  await docRef.update(updates)
  const updated = await docRef.get()
  return updated.data() as Task
}

export async function deleteTask(id: string): Promise<boolean> {
  const docRef = tasksCol.doc(id)
  const snap = await docRef.get()
  if (!snap.exists) return false
  await docRef.delete()
  return true
}
