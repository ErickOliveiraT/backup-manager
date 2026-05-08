import { Router } from 'express'
import type { Request, Response } from 'express'
import { getEvents, deleteEvent } from '../services/eventService.js'
import type { EventFilters } from '../services/eventService.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { device_id, status, task, source, date_from, date_to, page, limit } = req.query
  const filters: EventFilters = {
    device_id: typeof device_id === 'string' && device_id ? device_id : undefined,
    status: status === 'success' || status === 'error' ? status : undefined,
    task: typeof task === 'string' && task ? task : undefined,
    source: typeof source === 'string' && source ? source : undefined,
    date_from: typeof date_from === 'string' && date_from ? date_from : undefined,
    date_to: typeof date_to === 'string' && date_to ? date_to : undefined,
  }
  const pageNum = typeof page === 'string' ? Math.max(1, parseInt(page, 10) || 1) : 1
  const limitNum = typeof limit === 'string' ? Math.min(100, Math.max(10, parseInt(limit, 10) || 25)) : 25
  res.json(await getEvents(filters, pageNum, limitNum))
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
