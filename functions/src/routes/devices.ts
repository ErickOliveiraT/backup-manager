import { Router } from 'express'
import type { Request, Response } from 'express'
import { getDevices, addDevice, deviceExists, updateDevice, deleteDevice } from '../services/deviceService.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  res.json(await getDevices())
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
  if (await deviceExists(id)) {
    res.status(409).json({ error: `Device "${id}" already exists` })
    return
  }

  const device = await addDevice({ id, name })
  res.status(201).json(device)
})

router.patch('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { name } = req.body as Record<string, unknown>
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Field "name" is required' })
    return
  }
  const updated = await updateDevice(req.params.id, name)
  if (!updated) {
    res.status(404).json({ error: `Device "${req.params.id}" not found` })
    return
  }
  res.json(updated)
})

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const deleted = await deleteDevice(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: `Device "${req.params.id}" not found` })
    return
  }
  res.status(204).send()
})

export default router
