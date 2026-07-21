import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'

export interface AuthRequest extends Request {
  user?: {
    userId: number
    username: string
    nickname: string
    departmentId: number
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未授权访问' })
  }
  
  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return res.status(401).json({ message: '无效的令牌' })
  }
  
  req.user = decoded
  next()
}