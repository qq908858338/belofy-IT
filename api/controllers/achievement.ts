import { Request, Response } from 'express'
import prisma from '../lib/prisma'

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
    
    const achievement = await prisma.achievement.create({
      data: { taskId, projectId, type, url, fileName }
    })
    
    res.status(201).json(achievement)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function deleteAchievement(req: Request, res: Response) {
  try {
    const { id } = req.params
    
    await prisma.achievement.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ message: '成果已删除' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '成果不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}