import { Router } from 'express'
import type { Request, Response } from 'express'
import { getDevices, addDevice, deviceExists } from '../services/deviceService.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json(getDevices())
})

router.post('/', async (req: Request, res: Response) => {
  const { id, name } = req.body as Record<string, unknown>

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Field "id" is required' })
    return
  }
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Field "name" is required' })
    return
  }
  if (deviceExists(id)) {
    res.status(409).json({ error: `Device "${id}" already exists` })
    return
  }

  const device = await addDevice({ id, name })
  res.status(201).json(device)
})

export default router
