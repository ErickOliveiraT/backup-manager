import { Router } from 'express'
import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { getUserById, regenerateApiKey, updatePassword } from '../services/userService.js'

const router = Router()

router.get('/me', async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.userId)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  const { id, name, username, api_key } = user
  res.json({ id, name, username, api_key })
})

router.post('/me/api-key', async (req: Request, res: Response) => {
  const newKey = await regenerateApiKey(req.user!.userId)
  res.json({ api_key: newKey })
})

router.post('/me/password', async (req: Request, res: Response) => {
  const { current_password, new_password } = req.body as Record<string, unknown>

  if (typeof current_password !== 'string' || typeof new_password !== 'string') {
    res.status(400).json({ error: 'current_password and new_password are required' })
    return
  }

  if (new_password.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters' })
    return
  }

  const user = await getUserById(req.user!.userId)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const valid = await bcrypt.compare(current_password, user.password_hash)
  if (!valid) {
    res.status(401).json({ error: 'Current password is incorrect' })
    return
  }

  const hash = await bcrypt.hash(new_password, 12)
  await updatePassword(user.id, hash)

  res.status(204).end()
})

export default router
