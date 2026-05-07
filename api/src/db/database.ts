import { JSONFilePreset } from 'lowdb/node'
import type { Low } from 'lowdb'
import type { DbSchema } from '../types.js'

let db: Low<DbSchema>

export async function initDb(): Promise<void> {
  db = await JSONFilePreset<DbSchema>('db/data.json', { devices: [], events: [], tasks: [] })
}

export function getDb(): Low<DbSchema> {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}
