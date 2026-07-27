import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { recordLog } from '../lib/logHelper'
import type { AuthRequest } from '../middleware/auth'

export async function getAchievements(req: Request, res: Response) {
  try {
    const { taskId, projectId } = req.query
    
    const achievements = await prisma.achievement.findMany({
      where: {
        taskId: taskId ? parseInt(taskId as string) : undefined,
        projectId: projectId ? parseInt(projectId as string) : undefined
      }
    })
    
    res.json(achievements)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function createAchievement(req: Request, res: Response) {
  try {
    const { taskId, projectId, type, url, fileName } = req.body
    const authReq = req as AuthRequest
    
    const achievement = await prisma.achievement.create({
      data: { taskId, projectId, type, url, fileName }
    })
    
    recordLog(authReq.user?.userId, '创建', `创建了成果"${fileName}"`)
    
    res.status(201).json(achievement)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function deleteAchievement(req: Request, res: Response) {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    
    const achievement = await prisma.achievement.findUnique({ where: { id: parseInt(id) } })
    
    await prisma.achievement.delete({
      where: { id: parseInt(id) }
    })
    
    recordLog(authReq.user?.userId, '删除', `删除了成果"${achievement?.fileName || id}"`)
    
    res.json({ message: '成果已删除' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '成果不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}