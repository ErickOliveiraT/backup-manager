import { Router } from 'express'
import type { Request, Response } from 'express'
import { getAllEvents } from '../services/eventService.js'
import { getTasks } from '../services/taskService.js'
import { getDevices } from '../services/deviceService.js'
import { calculateStatus } from '../services/statusService.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const [events, tasks, devices] = await Promise.all([getAllEvents(), getTasks(), getDevices()])
  res.json(calculateStatus(events, tasks, devices))
})

export default router
