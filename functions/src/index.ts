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

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

function corsMiddleware() {
  return cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
}

function makeApp(router: express.Router, { protected: isProtected } = { protected: false }) {
  const app = express()
  app.use(corsMiddleware())
  app.options('*', corsMiddleware())
  app.use(express.json())
  if (isProtected) app.use(requireAuth)
  app.use('/', router)
  return app
}

const opts = { invoker: 'public' as const }

export const auth = onRequest(opts, makeApp(authRouter))

export const webhooks = onRequest(opts, makeApp(webhooksRouter))

export const devices = onRequest(opts, makeApp(devicesRouter, { protected: true }))

export const events = onRequest(opts, makeApp(eventsRouter, { protected: true }))

export const tasks = onRequest(opts, makeApp(tasksRouter, { protected: true }))

export const status = onRequest(opts, makeApp(statusRouter, { protected: true }))
