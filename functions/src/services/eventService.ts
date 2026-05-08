import { v4 as uuidv4 } from 'uuid'
import { eventsCol } from '../db/database.js'
import type { BackupEvent } from '../types.js'

export interface EventFilters {
  device_id?: string
  status?: 'success' | 'error'
  task?: string
  source?: string
  date_from?: string
  date_to?: string
}

export interface PaginatedEvents {
  data: BackupEvent[]
  total: number
  page: number
  pages: number
}

export async function addEvent(payload: Omit<BackupEvent, 'id'>): Promise<BackupEvent> {
  const event: BackupEvent = { id: uuidv4(), ...payload }
  await eventsCol.doc(event.id).set(event)
  return event
}

export async function getAllEvents(): Promise<BackupEvent[]> {
  const snap = await eventsCol.get()
  return snap.docs.map((d) => d.data() as BackupEvent)
}

export async function getEvents(
  filters: EventFilters = {},
  page = 1,
  limit = 25
): Promise<PaginatedEvents> {
  let events = await getAllEvents()

  if (filters.device_id) events = events.filter((e) => e.device_id === filters.device_id)
  if (filters.status) events = events.filter((e) => e.status === filters.status)
  if (filters.task) {
    const q = filters.task.toLowerCase()
    events = events.filter((e) => e.task.toLowerCase().includes(q))
  }
  if (filters.source) {
    const q = filters.source.toLowerCase()
    events = events.filter((e) => e.source.toLowerCase().includes(q))
  }
  if (filters.date_from) events = events.filter((e) => e.timestamp >= filters.date_from!)
  if (filters.date_to) events = events.filter((e) => e.timestamp <= filters.date_to! + 'T23:59:59.999Z')

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const total = events.length
  const pages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, pages)
  const start = (safePage - 1) * limit

  return { data: events.slice(start, start + limit), total, page: safePage, pages }
}

export async function deleteEvent(id: string): Promise<boolean> {
  const docRef = eventsCol.doc(id)
  const snap = await docRef.get()
  if (!snap.exists) return false
  await docRef.delete()
  return true
}
