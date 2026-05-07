import express from 'express'
import cors from 'cors'
import { initDb, getDb } from './db/database.js'
import webhooksRouter from './routes/webhooks.js'
import devicesRouter from './routes/devices.js'
import eventsRouter from './routes/events.js'
import statusRouter from './routes/status.js'
import tasksRouter from './routes/tasks.js'

const app = express()

app.use(cors())
app.use(express.json())

// Re-read the JSON file on every request so external writes (seed, manual edits) are visible immediately
app.use((_req, _res, next) => { getDb().read().then(() => next()).catch(next) })

app.use('/webhooks', webhooksRouter)
app.use('/devices', devicesRouter)
app.use('/events', eventsRouter)
app.use('/status', statusRouter)
app.use('/tasks', tasksRouter)

const start = async () => {
  await initDb()
  app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001')
  })
}

start()
