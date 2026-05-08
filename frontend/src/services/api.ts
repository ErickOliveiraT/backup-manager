import type { Device, BackupEvent, StatusEntry, Task } from '../types'
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

export const fetchEvents = (deviceId?: string) => {
  const qs = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''
  return request<BackupEvent[]>(`/events${qs}`)
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

export const fetchTasks = () => request<Task[]>('/tasks')

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
