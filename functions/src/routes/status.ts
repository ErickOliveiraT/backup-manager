import { Router } from 'express'
import type { Request, Response } from 'express'
import { getEvents } from '../services/eventService.js'
import { getTasks } from '../services/taskService.js'
import { calculateStatus } from '../services/statusService.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const [events, tasks] = await Promise.all([getEvents(), getTasks()])
  res.json(calculateStatus(events, tasks))
})

export default router
