import { router } from 'expo-router';
import { clearToken, getToken } from './auth';
import type {
  BackupEvent,
  Device,
  PaginatedDevices,
  PaginatedEvents,
  PaginatedTasks,
  StatusEntry,
  Task,
  User,
} from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://us-central1-backup-manager-2ae79.cloudfunctions.net';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !path.startsWith('/auth/')) {
    await clearToken();
    router.replace('/login');
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(username: string, password: string): Promise<string> {
  const data = await request<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return data.token;
}

export async function getStatus(): Promise<StatusEntry[]> {
  return request<StatusEntry[]>('/status');
}

export async function getDevices(page = 1, limit = 15): Promise<PaginatedDevices> {
  return request<PaginatedDevices>(`/devices?page=${page}&limit=${limit}`);
}

export async function createDevice(id: string, name: string): Promise<Device> {
  return request<Device>('/devices', {
    method: 'POST',
    body: JSON.stringify({ id, name }),
  });
}

export async function updateDevice(
  id: string,
  patch: { name?: string; notifications_enabled?: boolean }
): Promise<Device> {
  return request<Device>(`/devices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteDevice(id: string): Promise<void> {
  return request<void>(`/devices/${id}`, { method: 'DELETE' });
}

export async function getTasks(params: { device_id?: string; page?: number; limit?: number } = {}): Promise<PaginatedTasks> {
  const q = new URLSearchParams();
  if (params.device_id) q.set('device_id', params.device_id);
  q.set('page', String(params.page ?? 1));
  q.set('limit', String(params.limit ?? 15));
  return request<PaginatedTasks>(`/tasks?${q.toString()}`);
}

export async function createTask(payload: {
  device_id: string;
  task: string;
  cron?: string;
  warning_hours?: number;
  critical_hours?: number;
}): Promise<Task> {
  return request<Task>('/tasks', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateTask(
  id: string,
  payload: { cron?: string | null; warning_hours?: number | null; critical_hours?: number | null }
): Promise<Task> {
  return request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}

export async function getEvents(params: {
  device_id?: string;
  status?: 'success' | 'error';
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedEvents> {
  const q = new URLSearchParams();
  if (params.device_id) q.set('device_id', params.device_id);
  if (params.status) q.set('status', params.status);
  if (params.date_from) q.set('date_from', params.date_from);
  if (params.date_to) q.set('date_to', params.date_to);
  q.set('page', String(params.page ?? 1));
  q.set('limit', String(params.limit ?? 20));
  return request<PaginatedEvents>(`/events?${q.toString()}`);
}

export async function deleteEvent(id: string): Promise<void> {
  return request<void>(`/events/${id}`, { method: 'DELETE' });
}

export async function getMe(): Promise<User> {
  return request<User>('/users/me');
}

export async function regenerateApiKey(): Promise<string> {
  const data = await request<{ api_key: string }>('/users/me/api-key', { method: 'POST' });
  return data.api_key;
}

export async function changePassword(current_password: string, new_password: string): Promise<void> {
  return request<void>('/users/me/password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  });
}

export async function updateNotificationPreference(preference: User['notification_preference']): Promise<void> {
  return request<void>('/users/me/notifications', {
    method: 'PATCH',
    body: JSON.stringify({ notification_preference: preference }),
  });
}

export async function postFcmToken(token: string): Promise<void> {
  return request<void>('/users/me/fcm-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
