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
import { getDevices } from './services/deviceService.js'
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
    const [events, tasks, devices, users] = await Promise.all([getAllEvents(), getTasks(), getDevices(), getUsersWithFcmToken()])

    console.log(`[dailyNotifications] events=${events.length} tasks=${tasks.length} devices=${devices.length} eligible_users=${users.length}`)

    const deviceNameMap = new Map(devices.map((d) => [d.id, d.name]))
    const deviceMap = new Map(devices.map((d) => [d.id, d]))

    const allStatuses = calculateStatus(events, tasks)
    const issues = allStatuses.filter(
      (s) => s.status !== 'healthy' && (deviceMap.get(s.device_id)?.notifications_enabled ?? true)
    )

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

      for (const issue of filtered) {
        const deviceName = deviceNameMap.get(issue.device_id) ?? issue.device_id
        const title = `${issue.status === 'critical' ? '🔴' : '🟡'} ${issue.task}`
        const body = `${deviceName} · ${issue.status}`

        console.log(`[dailyNotifications] sending to user=${user.id} title="${title}" body="${body}"`)

        try {
          const messageId = await getMessaging().send({
            token: user.fcm_token!,
            notification: { title, body },
            data: { device_id: issue.device_id, task: issue.task, status: issue.status },
            android: {
              priority: 'high',
              notification: {
                tag: `${issue.device_id}:${issue.task}`,
              },
            },
          })
          console.log(`[dailyNotifications] sent ok user=${user.id} messageId=${messageId}`)
        } catch (err) {
          console.error(`[dailyNotifications] send failed user=${user.id} task=${issue.task}`, err)
        }
      }
    }

    console.log('[dailyNotifications] done')
  }
)
