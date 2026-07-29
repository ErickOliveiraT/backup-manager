import { Router } from 'express'
import type { Request, Response } from 'express'
import { getDevices, getDevicesPaginated, addDevice, deviceExists, updateDevice, deleteDevice } from '../services/deviceService.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { page, limit } = req.query as Record<string, string>
  if (page !== undefined) {
    res.json(await getDevicesPaginated(Number(page) || 1, Number(limit) || 10))
  } else {
    res.json(await getDevices())
  }
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
  const { name, notifications_enabled } = req.body as Record<string, unknown>
  const patch: { name?: string; notifications_enabled?: boolean } = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || !name) {
      res.status(400).json({ error: 'Field "name" is required' })
      return
    }
    patch.name = name
  }
  if (notifications_enabled !== undefined) {
    if (typeof notifications_enabled !== 'boolean') {
      res.status(400).json({ error: 'Field "notifications_enabled" must be a boolean' })
      return
    }
    patch.notifications_enabled = notifications_enabled
  }
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'Field "name" is required' })
    return
  }

  const updated = await updateDevice(req.params.id, patch)
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
