import { Router } from 'express'
import type { Request, Response } from 'express'
import { addEvent } from '../services/eventService.js'
import { deviceExists, addDevice } from '../services/deviceService.js'
import { taskExists, addTask } from '../services/taskService.js'
import type { BackupEvent } from '../types.js'

const router = Router()

const REQUIRED = ['device_id', 'source', 'task', 'status'] as const

function nowInSaoPaulo(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + '-03:00'
}

router.post('/sync', async (req: Request, res: Response) => {
  const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY
  if (!WEBHOOK_API_KEY) {
    res.status(500).json({ error: 'Server misconfiguration' })
    return
  }

  const body = req.body as Record<string, unknown>

  if (body.api_key !== WEBHOOK_API_KEY) {
    res.status(401).json({ error: 'Invalid or missing api_key' })
    return
  }

  const missing = REQUIRED.filter((field) => !body[field])
  if (missing.length > 0) {
    res.status(400).json({ error: 'Missing required fields', fields: missing })
    return
  }

  const payload: Omit<BackupEvent, 'id'> = {
    device_id: body.device_id as string,
    source: body.source as string,
    task: body.task as string,
    status: body.status as BackupEvent['status'],
    timestamp: nowInSaoPaulo(),
  }

  const event = await addEvent(payload)

  await Promise.all([
    deviceExists(payload.device_id).then((exists) => {
      if (!exists) return addDevice({ id: payload.device_id, name: payload.device_id })
    }),
    taskExists(payload.device_id, payload.task).then((exists) => {
      if (!exists) return addTask({ device_id: payload.device_id, task: payload.task })
    }),
  ])

  res.status(201).json(event)
})

export default router
