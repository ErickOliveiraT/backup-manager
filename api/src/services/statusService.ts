import type { BackupEvent, Task, StatusEntry } from '../types.js'

const HOUR = 60 * 60 * 1000
const DEFAULT_WARNING_H = 24
const DEFAULT_CRITICAL_H = 72

export function calculateStatus(events: BackupEvent[], tasks: Task[]): StatusEntry[] {
  const taskMap = new Map<string, Task>()
  for (const t of tasks) {
    taskMap.set(`${t.device_id}:${t.task}`, t)
  }

  const groups = new Map<string, BackupEvent[]>()
  for (const event of events) {
    const key = `${event.device_id}:${event.task}`
    const group = groups.get(key) ?? []
    group.push(event)
    groups.set(key, group)
  }

  const result: StatusEntry[] = []

  for (const [key, groupEvents] of groups) {
    const [device_id, task] = key.split(':')
    const sorted = [...groupEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const lastEvent = sorted[0]
    const lastSuccess = sorted.find((e) => e.status === 'success')
    const now = Date.now()
    const taskConfig = taskMap.get(key)

    const warnMs = (taskConfig?.warning_hours ?? DEFAULT_WARNING_H) * HOUR
    const critMs = (taskConfig?.critical_hours ?? DEFAULT_CRITICAL_H) * HOUR

    let status: StatusEntry['status']

    if (lastEvent.status === 'error') {
      status = 'critical'
    } else if (!lastSuccess) {
      status = 'critical'
    } else {
      const age = now - new Date(lastSuccess.timestamp).getTime()
      if (age > critMs) {
        status = 'critical'
      } else if (age > warnMs) {
        status = 'warning'
      } else {
        status = 'healthy'
      }
    }

    result.push({ device_id, task, last_event: lastEvent, status, task_config: taskConfig })
  }

  return result
}
