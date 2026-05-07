import { JSONFilePreset } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import type { DbSchema, BackupEvent, Task } from '../src/types.js'

const HOUR = 60 * 60 * 1000

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * HOUR).toISOString()
}

const events: Omit<BackupEvent, 'id'>[] = [
  // latitude-fit — healthy (documents), warning (photos), critical (system >72h)
  { device_id: 'latitude-fit', source: 'opensync', task: 'documents-backup',  status: 'success', timestamp: hoursAgo(2) },
  { device_id: 'latitude-fit', source: 'opensync', task: 'documents-backup',  status: 'success', timestamp: hoursAgo(26) },
  { device_id: 'latitude-fit', source: 'opensync', task: 'photos-backup',     status: 'success', timestamp: hoursAgo(30) },
  { device_id: 'latitude-fit', source: 'opensync', task: 'photos-backup',     status: 'success', timestamp: hoursAgo(54) },
  { device_id: 'latitude-fit', source: 'rsync',    task: 'system-backup',     status: 'success', timestamp: hoursAgo(80) },

  // expert-x50 — healthy (documents), critical via error (system)
  { device_id: 'expert-x50',   source: 'opensync', task: 'documents-backup',  status: 'success', timestamp: hoursAgo(1) },
  { device_id: 'expert-x50',   source: 'opensync', task: 'documents-backup',  status: 'success', timestamp: hoursAgo(25) },
  { device_id: 'expert-x50',   source: 'rsync',    task: 'system-backup',     status: 'success', timestamp: hoursAgo(10) },
  { device_id: 'expert-x50',   source: 'rsync',    task: 'system-backup',     status: 'error',   timestamp: hoursAgo(3) },

  // m53 — healthy (photos), warning (contacts)
  { device_id: 'm53',          source: 'android',  task: 'photos-backup',     status: 'success', timestamp: hoursAgo(4) },
  { device_id: 'm53',          source: 'android',  task: 'contacts-backup',   status: 'success', timestamp: hoursAgo(36) },
  { device_id: 'm53',          source: 'android',  task: 'contacts-backup',   status: 'success', timestamp: hoursAgo(60) },

  // g15 — critical (whatsapp >72h), warning (photos)
  { device_id: 'g15',          source: 'android',  task: 'whatsapp-backup',   status: 'success', timestamp: hoursAgo(90) },
  { device_id: 'g15',          source: 'android',  task: 'photos-backup',     status: 'success', timestamp: hoursAgo(48) },
  { device_id: 'g15',          source: 'android',  task: 'photos-backup',     status: 'success', timestamp: hoursAgo(72) },
]

// Tasks: algumas com config customizada, outras sem (usa defaults do sistema)
const tasks: Omit<Task, 'id' | 'created_at'>[] = [
  // latitude-fit
  { device_id: 'latitude-fit', task: 'documents-backup', cron: '0 2 * * 1-5' },           // sem thresholds customizados
  { device_id: 'latitude-fit', task: 'photos-backup',    cron: '0 3 * * 0',   warning_hours: 48, critical_hours: 96 },
  { device_id: 'latitude-fit', task: 'system-backup',    cron: '0 4 * * 0' },              // weekly

  // expert-x50
  { device_id: 'expert-x50',   task: 'documents-backup', cron: '0 1 * * *' },
  { device_id: 'expert-x50',   task: 'system-backup',    cron: '0 5 * * 0',   warning_hours: 12, critical_hours: 36 },

  // m53
  { device_id: 'm53',          task: 'photos-backup',    cron: '0 2 * * *' },
  { device_id: 'm53',          task: 'contacts-backup' },                                  // sem cron nem thresholds

  // g15
  { device_id: 'g15',          task: 'whatsapp-backup',  cron: '0 6 * * *',   warning_hours: 30, critical_hours: 72 },
  { device_id: 'g15',          task: 'photos-backup',    cron: '0 6 * * *' },
]

async function main() {
  const db = await JSONFilePreset<DbSchema>('db/data.json', { devices: [], events: [], tasks: [] })

  db.data.events = events.map((e) => ({ id: uuidv4(), ...e }))
  db.data.tasks = tasks.map((t) => ({
    id: uuidv4(),
    created_at: new Date().toISOString(),
    ...t,
  }))

  await db.write()

  console.log(`Seeded ${db.data.events.length} events and ${db.data.tasks.length} tasks across ${db.data.devices.length} devices.`)
  console.log('\nExpected statuses:')
  console.log('  latitude-fit / documents-backup  → healthy  (2h ago,  defaults)')
  console.log('  latitude-fit / photos-backup     → warning  (30h ago, warn=48h)')
  console.log('  latitude-fit / system-backup     → critical (80h ago, defaults)')
  console.log('  expert-x50   / documents-backup  → healthy  (1h ago,  defaults)')
  console.log('  expert-x50   / system-backup     → critical (last event: error, warn=12h)')
  console.log('  m53          / photos-backup      → healthy  (4h ago,  defaults)')
  console.log('  m53          / contacts-backup    → warning  (36h ago, defaults)')
  console.log('  g15          / whatsapp-backup    → critical (90h ago, crit=72h)')
  console.log('  g15          / photos-backup      → warning  (48h ago, defaults)')
}

main()
