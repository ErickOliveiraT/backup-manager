import { JSONFilePreset } from 'lowdb/node'
import type { DbSchema } from '../src/types.js'

async function main() {
  const db = await JSONFilePreset<DbSchema>('db/data.json', { devices: [], events: [], tasks: [] })
  const count = db.data.events.length
  db.data.events = []
  await db.write()
  console.log(`Removed ${count} events.`)
}

main()
