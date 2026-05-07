import { Router } from 'express'
import type { Request, Response } from 'express'
import { getEvents } from '../services/eventService.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const deviceId = req.query.device_id as string | undefined
  res.json(getEvents(deviceId))
})

export default router
