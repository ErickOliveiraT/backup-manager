import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { findUserByApiKey } from '../services/userService.js'

const JWT_SECRET = process.env.JWT_SECRET!

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string; username: string }
    req.user = { userId: payload.userId, username: payload.username }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const body = req.body as Record<string, unknown>
  const apiKey = body.api_key as string | undefined

  if (!apiKey) {
    res.status(401).json({ error: 'Missing api_key' })
    return
  }

  const user = await findUserByApiKey(apiKey)
  if (!user) {
    res.status(401).json({ error: 'Invalid api_key' })
    return
  }

  req.user = { userId: user.id, username: user.username }
  next()
}
