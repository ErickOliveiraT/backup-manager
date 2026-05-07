import { getDb } from '../db/database.js'
import type { Device } from '../types.js'

export function getDevices(): Device[] {
  return getDb().data.devices
}

export async function addDevice(payload: { id: string; name: string }): Promise<Device> {
  const db = getDb()
  const device: Device = { ...payload, created_at: new Date().toISOString() }
  db.data.devices.push(device)
  await db.write()
  return device
}

export function deviceExists(id: string): boolean {
  return getDb().data.devices.some((d) => d.id === id)
}
