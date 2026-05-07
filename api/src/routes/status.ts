import { Router } from 'express'
import type { Request, Response } from 'express'
import { getEvents } from '../services/eventService.js'
import { getTasks } from '../services/taskService.js'
import { calculateStatus } from '../services/statusService.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const events = getEvents()
  const tasks = getTasks()
  res.json(calculateStatus(events, tasks))
})

export default router
