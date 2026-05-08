import { v4 as uuidv4 } from 'uuid'
import { eventsCol } from '../db/database.js'
import type { BackupEvent } from '../types.js'

export async function addEvent(payload: Omit<BackupEvent, 'id'>): Promise<BackupEvent> {
  const event: BackupEvent = { id: uuidv4(), ...payload }
  await eventsCol.doc(event.id).set(event)
  return event
}

export async function getEvents(deviceId?: string): Promise<BackupEvent[]> {
  const query = deviceId ? eventsCol.where('device_id', '==', deviceId) : eventsCol
  const snap = await query.get()
  return snap.docs.map((d) => d.data() as BackupEvent)
}
