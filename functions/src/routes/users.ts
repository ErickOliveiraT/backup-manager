import { Router } from 'express'
import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import {
  getUserById,
  regenerateApiKey,
  updateFcmToken,
  updateNotificationPreference,
  updatePassword,
} from '../services/userService.js'
import type { User } from '../types.js'

const router = Router()

router.get('/me', async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.userId)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  const { id, name, username, api_key, notification_preference } = user
  res.json({ id, name, username, api_key, notification_preference: notification_preference ?? 'none' })
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

router.patch('/me/notifications', async (req: Request, res: Response) => {
  const { notification_preference } = req.body as Record<string, unknown>
  const valid: User['notification_preference'][] = ['none', 'warning_and_critical', 'critical_only']
  if (!valid.includes(notification_preference as User['notification_preference'])) {
    res.status(400).json({ error: 'Invalid notification_preference' })
    return
  }
  await updateNotificationPreference(req.user!.userId, notification_preference as User['notification_preference'])
  res.status(204).end()
})

router.post('/me/fcm-token', async (req: Request, res: Response) => {
  const { token } = req.body as Record<string, unknown>
  if (typeof token !== 'string' || !token) {
    res.status(400).json({ error: 'token is required' })
    return
  }
  await updateFcmToken(req.user!.userId, token)
  res.status(204).end()
})

export default router
