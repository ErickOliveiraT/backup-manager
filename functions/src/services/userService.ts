import { v4 as uuidv4 } from 'uuid'
import { usersCol } from '../db/database.js'
import type { User } from '../types.js'

function docToUser(id: string, data: FirebaseFirestore.DocumentData): User {
  return { id, ...data } as User
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const snap = await usersCol.where('username', '==', username).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  return docToUser(doc.id, doc.data())
}

export async function findUserByApiKey(apiKey: string): Promise<User | null> {
  const snap = await usersCol.where('api_key', '==', apiKey).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  return docToUser(doc.id, doc.data())
}

export async function getUserById(id: string): Promise<User | null> {
  const doc = await usersCol.doc(id).get()
  if (!doc.exists) return null
  return docToUser(doc.id, doc.data()!)
}

export async function regenerateApiKey(userId: string): Promise<string> {
  const newKey = uuidv4()
  await usersCol.doc(userId).update({ api_key: newKey })
  return newKey
}

export async function updatePassword(userId: string, newPasswordHash: string): Promise<void> {
  await usersCol.doc(userId).update({ password_hash: newPasswordHash })
}

export async function updateNotificationPreference(
  userId: string,
  pref: User['notification_preference']
): Promise<void> {
  await usersCol.doc(userId).update({ notification_preference: pref })
}

export async function updateFcmToken(userId: string, token: string): Promise<void> {
  await usersCol.doc(userId).update({ fcm_token: token })
}

export async function getUsersWithFcmToken(): Promise<User[]> {
  const snap = await usersCol.get()
  return snap.docs
    .map((d) => docToUser(d.id, d.data()))
    .filter((u) => u.fcm_token && u.notification_preference !== 'none')
}
