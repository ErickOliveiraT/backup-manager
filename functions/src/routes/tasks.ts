import { Router } from 'express'
import type { Request, Response } from 'express'
import { getTasks, addTask, updateTask, deleteTask, taskExists } from '../services/taskService.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  res.json(await getTasks())
})

router.post('/', async (req: Request, res: Response) => {
  const { device_id, task, cron, warning_hours, critical_hours } = req.body as Record<string, unknown>

  if (!device_id || typeof device_id !== 'string') {
    res.status(400).json({ error: 'Field "device_id" is required' })
    return
  }
  if (!task || typeof task !== 'string') {
    res.status(400).json({ error: 'Field "task" is required' })
    return
  }
  if (await taskExists(device_id, task)) {
    res.status(409).json({ error: `Task "${task}" already exists for device "${device_id}"` })
    return
  }
  if (
    warning_hours !== undefined &&
    critical_hours !== undefined &&
    Number(warning_hours) >= Number(critical_hours)
  ) {
    res.status(400).json({ error: '"warning_hours" must be less than "critical_hours"' })
    return
  }

  const created = await addTask({
    device_id,
    task,
    ...(cron !== undefined && { cron: cron as string }),
    ...(warning_hours !== undefined && { warning_hours: Number(warning_hours) }),
    ...(critical_hours !== undefined && { critical_hours: Number(critical_hours) }),
  })
  res.status(201).json(created)
})

router.patch('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string
  const { cron, warning_hours, critical_hours } = req.body as Record<string, unknown>

  const wh = warning_hours !== undefined ? (warning_hours === null ? null : Number(warning_hours)) : undefined
  const ch = critical_hours !== undefined ? (critical_hours === null ? null : Number(critical_hours)) : undefined

  if (wh !== undefined && wh !== null && ch !== undefined && ch !== null && wh >= ch) {
    res.status(400).json({ error: '"warning_hours" must be less than "critical_hours"' })
    return
  }

  const updated = await updateTask(id, {
    ...(cron !== undefined && { cron: (Array.isArray(cron) ? cron[0] : cron) as string | null }),
    ...(wh !== undefined && { warning_hours: wh }),
    ...(ch !== undefined && { critical_hours: ch }),
  })

  if (!updated) {
    res.status(404).json({ error: `Task "${id}" not found` })
    return
  }

  res.json(updated)
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string
  const deleted = await deleteTask(id)
  if (!deleted) {
    res.status(404).json({ error: `Task "${id}" not found` })
    return
  }
  res.status(204).send()
})

export default router
