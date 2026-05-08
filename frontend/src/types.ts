export interface Device {
  id: string
  name: string
  created_at: string
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

export interface PaginatedEvents {
  data: BackupEvent[]
  total: number
  page: number
  pages: number
}

export interface StatusEntry {
  device_id: string
  task: string
  last_event: BackupEvent
  status: 'healthy' | 'warning' | 'critical'
  task_config?: Task
}
