import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/database.js'
import type { BackupEvent } from '../types.js'

export async function addEvent(payload: Omit<BackupEvent, 'id'>): Promise<BackupEvent> {
  const db = getDb()
  const event: BackupEvent = { id: uuidv4(), ...payload }
  db.data.events.push(event)
  await db.write()
  return event
}

export function getEvents(deviceId?: string): BackupEvent[] {
  const db = getDb()
  if (deviceId) {
    return db.data.events.filter((e) => e.device_id === deviceId)
  }
  return db.data.events
}
