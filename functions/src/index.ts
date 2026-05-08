import { onRequest } from 'firebase-functions/v2/https'
import express from 'express'
import cors from 'cors'
import './db/database.js'
import { requireAuth } from './middleware/auth.js'
import authRouter from './routes/auth.js'
import webhooksRouter from './routes/webhooks.js'
import devicesRouter from './routes/devices.js'
import eventsRouter from './routes/events.js'
import statusRouter from './routes/status.js'
import tasksRouter from './routes/tasks.js'

function makeApp(router: express.Router, { protected: isProtected } = { protected: false }) {
  const app = express()
  app.use(cors())
  app.use(express.json())
  if (isProtected) app.use(requireAuth)
  app.use('/', router)
  return app
}

export const auth = onRequest(makeApp(authRouter))

export const webhooks = onRequest(makeApp(webhooksRouter))

export const devices = onRequest(makeApp(devicesRouter, { protected: true }))

export const events = onRequest(makeApp(eventsRouter, { protected: true }))

export const tasks = onRequest(makeApp(tasksRouter, { protected: true }))

export const status = onRequest(makeApp(statusRouter, { protected: true }))
