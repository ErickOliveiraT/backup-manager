import { Router } from 'express'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

router.post('/login', (req: Request, res: Response) => {
  const LOGIN_USER = process.env.LOGIN_USER
  const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD
  const JWT_SECRET = process.env.JWT_SECRET

  if (!LOGIN_USER || !LOGIN_PASSWORD || !JWT_SECRET) {
    res.status(500).json({ error: 'Server misconfiguration' })
    return
  }

  const { username, password } = req.body as Record<string, unknown>

  if (username !== LOGIN_USER || password !== LOGIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token })
})

export default router
