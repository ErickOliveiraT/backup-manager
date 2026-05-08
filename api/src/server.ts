import './db/database.js'
import express from 'express'
import cors from 'cors'
import webhooksRouter from './routes/webhooks.js'
import devicesRouter from './routes/devices.js'
import eventsRouter from './routes/events.js'
import statusRouter from './routes/status.js'
import tasksRouter from './routes/tasks.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/webhooks', webhooksRouter)
app.use('/devices', devicesRouter)
app.use('/events', eventsRouter)
app.use('/status', statusRouter)
app.use('/tasks', tasksRouter)

app.listen(3001, () => {
  console.log('Backend running on http://localhost:3001')
})
