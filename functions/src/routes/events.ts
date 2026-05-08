import { Router } from 'express'
import type { Request, Response } from 'express'
import { getEvents, deleteEvent } from '../services/eventService.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const raw = req.query.device_id
  const deviceId = typeof raw === 'string' ? raw : undefined
  res.json(await getEvents(deviceId))
})

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const deleted = await deleteEvent(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: `Event "${req.params.id}" not found` })
    return
  }
  res.status(204).send()
})

export default router
