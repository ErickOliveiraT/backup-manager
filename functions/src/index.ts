import { onRequest } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import express from 'express'
import cors from 'cors'
import { getMessaging } from 'firebase-admin/messaging'
import './db/database.js'
import { requireAuth } from './middleware/auth.js'
import authRouter from './routes/auth.js'
import webhooksRouter from './routes/webhooks.js'
import devicesRouter from './routes/devices.js'
import eventsRouter from './routes/events.js'
import statusRouter from './routes/status.js'
import tasksRouter from './routes/tasks.js'
import usersRouter from './routes/users.js'
import { getAllEvents } from './services/eventService.js'
import { getTasks } from './services/taskService.js'
import { calculateStatus } from './services/statusService.js'
import { getUsersWithFcmToken } from './services/userService.js'

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

export const users = onRequest(opts, makeApp(usersRouter, { protected: true }))

export const dailyNotifications = onSchedule(
  { schedule: '0 20 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    const [events, tasks, users] = await Promise.all([getAllEvents(), getTasks(), getUsersWithFcmToken()])

    console.log(`[dailyNotifications] events=${events.length} tasks=${tasks.length} eligible_users=${users.length}`)

    const allStatuses = calculateStatus(events, tasks)
    const issues = allStatuses.filter((s) => s.status !== 'healthy')

    console.log(`[dailyNotifications] total_statuses=${allStatuses.length} issues=${issues.length}`)
    issues.forEach((s) => console.log(`[dailyNotifications] issue device=${s.device_id} task=${s.task} status=${s.status}`))

    if (users.length === 0) {
      console.log('[dailyNotifications] no eligible users (missing fcm_token or preference=none) — skipping')
      return
    }

    for (const user of users) {
      console.log(`[dailyNotifications] processing user=${user.id} preference=${user.notification_preference} fcm_token=${user.fcm_token?.slice(0, 20)}...`)

      const filtered =
        user.notification_preference === 'critical_only'
          ? issues.filter((s) => s.status === 'critical')
          : issues

      if (filtered.length === 0) {
        console.log(`[dailyNotifications] user=${user.id} — no issues match preference, skipping`)
        continue
      }

      const critCount = filtered.filter((s) => s.status === 'critical').length
      const warnCount = filtered.filter((s) => s.status === 'warning').length
      const parts: string[] = []
      if (critCount > 0) parts.push(`${critCount} crítico${critCount > 1 ? 's' : ''}`)
      if (warnCount > 0) parts.push(`${warnCount} aviso${warnCount > 1 ? 's' : ''}`)

      const body = `Há ${parts.join(' e ')} nos seus backups.`
      console.log(`[dailyNotifications] sending to user=${user.id} body="${body}"`)

      try {
        const messageId = await getMessaging().send({
          token: user.fcm_token!,
          notification: { title: 'Backup Manager', body },
          data: { critical: String(critCount), warning: String(warnCount) },
        })
        console.log(`[dailyNotifications] sent ok user=${user.id} messageId=${messageId}`)
      } catch (err) {
        console.error(`[dailyNotifications] send failed user=${user.id}`, err)
      }
    }

    console.log('[dailyNotifications] done')
  }
)
