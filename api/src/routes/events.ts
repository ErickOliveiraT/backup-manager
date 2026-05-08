import { Router } from 'express'
import type { Request, Response } from 'express'
import { getEvents } from '../services/eventService.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const deviceId = req.query.device_id as string | undefined
  res.json(await getEvents(deviceId))
})

export default router
