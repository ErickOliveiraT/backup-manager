import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp()
}

const db = getFirestore()

export const devicesCol = db.collection('devices')
export const eventsCol = db.collection('events')
export const tasksCol = db.collection('tasks')
