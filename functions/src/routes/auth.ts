import { Router } from 'express'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { findUserByUsername } from '../services/userService.js'

const router = Router()

router.post('/login', async (req: Request, res: Response) => {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    res.status(500).json({ error: 'Server misconfiguration' })
    return
  }

  const { username, password } = req.body as Record<string, unknown>

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'username and password are required' })
    return
  }

  const user = await findUserByUsername(username)
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '365d' })
  res.json({ token })
})

export default router
