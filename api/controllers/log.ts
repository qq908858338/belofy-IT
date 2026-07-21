import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function getLogs(req: Request, res: Response) {
  try {
    const { action, limit = 100, offset = 0 } = req.query
    
    const logs = await prisma.systemLog.findMany({
      where: { action: action as string },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    })
    
    res.json(logs)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function createLog(req: Request, res: Response) {
  try {
    const { action, userId, description } = req.body
    
    const log = await prisma.systemLog.create({
      data: { action, userId, description }
    })
    
    res.status(201).json(log)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function exportLogs(req: Request, res: Response) {
  try {
    const logs = await prisma.systemLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })
    
    const csv = [['时间', '操作', '用户', '描述']]
      .concat(logs.map(log => [
        log.createdAt.toISOString(),
        log.action,
        log.user?.nickname || '',
        log.description
      ]))
      .map(row => row.join(','))
      .join('\n')
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv')
    res.send(csv)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}