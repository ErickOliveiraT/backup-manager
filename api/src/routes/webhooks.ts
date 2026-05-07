import { Router } from 'express'
import type { Request, Response } from 'express'
import { addEvent } from '../services/eventService.js'
import { taskExists, addTask } from '../services/taskService.js'
import type { BackupEvent } from '../types.js'

const router = Router()

const REQUIRED = ['device_id', 'source', 'task', 'status', 'timestamp'] as const

router.post('/sync', async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>

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
    timestamp: body.timestamp as string,
  }

  const event = await addEvent(payload)

  if (!taskExists(payload.device_id, payload.task)) {
    await addTask({ device_id: payload.device_id, task: payload.task })
  }

  res.status(201).json(event)
})

export default router
