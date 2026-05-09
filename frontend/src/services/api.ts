import type { Device, BackupEvent, StatusEntry, Task, PaginatedEvents, PaginatedTasks } from '../types'
import { getToken, clearToken } from './auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401 && path !== '/auth/login') {
    clearToken()
    window.location.replace('/login')
    return new Promise(() => {})
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const login = (username: string, password: string) =>
  request<{ token: string }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

export const fetchStatus = () => request<StatusEntry[]>('/status')

export const fetchDevices = () => request<Device[]>('/devices')

export interface EventFilters {
  device_id?: string
  status?: string
  task?: string
  source?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

export const fetchEvents = async (filters: EventFilters = {}): Promise<PaginatedEvents> => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })
  const qs = params.size ? `?${params}` : ''
  const result = await request<PaginatedEvents | BackupEvent[]>(`/events${qs}`)
  if (Array.isArray(result)) {
    return { data: result, total: result.length, page: 1, pages: 1 }
  }
  return result
}

export const createDevice = (data: { id: string; name: string }) =>
  request<Device>('/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const updateDevice = (id: string, name: string) =>
  request<Device>(`/devices/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

export interface TaskFilters {
  device_id?: string
  page?: number
  limit?: number
}

export const fetchTasks = async (filters: TaskFilters = {}): Promise<PaginatedTasks> => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v))
  })
  const qs = params.size ? `?${params}` : ''
  const result = await request<PaginatedTasks | Task[]>(`/tasks${qs}`)
  if (Array.isArray(result)) {
    return { data: result, total: result.length, page: 1, pages: 1 }
  }
  return result
}

export const createTask = (data: {
  device_id: string
  task: string
  cron?: string
  warning_hours?: number
  critical_hours?: number
}) =>
  request<Task>('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const deleteTask = (id: string) =>
  request<void>(`/tasks/${id}`, { method: 'DELETE' })

export const deleteDevice = (id: string) =>
  request<void>(`/devices/${id}`, { method: 'DELETE' })

export const deleteEvent = (id: string) =>
  request<void>(`/events/${id}`, { method: 'DELETE' })

export const updateTask = (
  id: string,
  patch: { cron?: string | null; warning_hours?: number | null; critical_hours?: number | null }
) =>
  request<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
