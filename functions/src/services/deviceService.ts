import { devicesCol } from '../db/database.js'
import type { Device } from '../types.js'

export async function getDevices(): Promise<Device[]> {
  const snap = await devicesCol.get()
  return snap.docs.map((d) => d.data() as Device)
}

export async function addDevice(payload: { id: string; name: string }): Promise<Device> {
  const device: Device = { ...payload, created_at: new Date().toISOString() }
  await devicesCol.doc(device.id).set(device)
  return device
}

export async function deviceExists(id: string): Promise<boolean> {
  const snap = await devicesCol.doc(id).get()
  return snap.exists
}

export async function updateDevice(id: string, name: string): Promise<Device | null> {
  const docRef = devicesCol.doc(id)
  const snap = await docRef.get()
  if (!snap.exists) return null
  await docRef.update({ name })
  return { ...(snap.data() as Device), name }
}

export async function deleteDevice(id: string): Promise<boolean> {
  const docRef = devicesCol.doc(id)
  const snap = await docRef.get()
  if (!snap.exists) return false
  await docRef.delete()
  return true
}
