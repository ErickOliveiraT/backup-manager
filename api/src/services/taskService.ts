import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/database.js'
import type { Task } from '../types.js'

export function getTasks(): Task[] {
  return getDb().data.tasks ?? []
}

export function getTask(deviceId: string, taskName: string): Task | undefined {
  return getTasks().find((t) => t.device_id === deviceId && t.task === taskName)
}

export function taskExists(deviceId: string, taskName: string): boolean {
  return !!getTask(deviceId, taskName)
}

type AddTaskPayload = Pick<Task, 'device_id' | 'task'> &
  Partial<Pick<Task, 'cron' | 'warning_hours' | 'critical_hours'>>

export async function addTask(payload: AddTaskPayload): Promise<Task> {
  const db = getDb()
  if (!db.data.tasks) db.data.tasks = []
  const task: Task = {
    id: uuidv4(),
    device_id: payload.device_id,
    task: payload.task,
    ...(payload.cron !== undefined && { cron: payload.cron }),
    ...(payload.warning_hours !== undefined && { warning_hours: payload.warning_hours }),
    ...(payload.critical_hours !== undefined && { critical_hours: payload.critical_hours }),
    created_at: new Date().toISOString(),
  }
  db.data.tasks.push(task)
  await db.write()
  return task
}

type PatchTaskPayload = Partial<{
  cron: string | null
  warning_hours: number | null
  critical_hours: number | null
}>

export async function updateTask(id: string, patch: PatchTaskPayload): Promise<Task | null> {
  const db = getDb()
  const idx = (db.data.tasks ?? []).findIndex((t) => t.id === id)
  if (idx === -1) return null

  const task = db.data.tasks[idx]

  if ('cron' in patch) {
    if (patch.cron === null) delete task.cron
    else task.cron = patch.cron!
  }
  if ('warning_hours' in patch) {
    if (patch.warning_hours === null) delete task.warning_hours
    else task.warning_hours = patch.warning_hours!
  }
  if ('critical_hours' in patch) {
    if (patch.critical_hours === null) delete task.critical_hours
    else task.critical_hours = patch.critical_hours!
  }

  await db.write()
  return task
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = getDb()
  const before = (db.data.tasks ?? []).length
  db.data.tasks = db.data.tasks.filter((t) => t.id !== id)
  if (db.data.tasks.length === before) return false
  await db.write()
  return true
}
