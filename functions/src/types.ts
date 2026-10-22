export interface Device {
  id: string
  name: string
  created_at: string
  notifications_enabled?: boolean
}

export interface BackupEvent {
  id: string
  device_id: string
  source: string
  task: string
  status: 'success' | 'error'
  timestamp: string
}

export interface Task {
  id: string
  device_id: string
  task: string
  cron?: string
  warning_hours?: number
  critical_hours?: number
  created_at: string
}

export interface User {
  id: string
  name: string
  username: string
  password_hash: string
  api_key: string
  created_at: string
  notification_preference: 'none' | 'warning_and_critical' | 'critical_only'
  fcm_token: string | null
}

export interface StatusEntry {
  device_id: string
  task: string
  last_event: BackupEvent
  status: 'healthy' | 'warning' | 'critical'
  event_count: number
  task_config?: Task
}
