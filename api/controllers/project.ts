import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function getProjects(req: Request, res: Response) {
  try {
    const { userId, isArchived } = req.query
    
    let where: any = {
      isArchived: isArchived ? isArchived === 'true' : undefined
    }
    
    if (userId) {
      const userProjects = await prisma.projectMember.findMany({
        where: { userId: parseInt(userId as string) },
        select: { projectId: true }
      })
      const projectIds = userProjects.map(p => p.projectId)
      where.OR = [
        { id: { in: projectIds } },
        { managerId: parseInt(userId as string) }
      ]
    }
    
    const projects = await prisma.project.findMany({
      where,
      include: {
        manager: true,
        tasks: true,
        members: { include: { user: true } }
      }
    })
    
    res.json(projects)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function createProject(req: Request, res: Response) {
  try {
    const { name, status, managerId, members } = req.body
    
    const project = await prisma.project.create({
      data: {
        name,
        status,
        managerId
      }
    })
    
    if (members && members.length > 0) {
      await prisma.projectMember.createMany({
        data: members.map((userId: number) => ({
          projectId: project.id,
          userId,
          isManager: userId === managerId
        }))
      })
    }
    
    res.status(201).json(project)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function updateProject(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, status, managerId, isArchived, members } = req.body
    
    const data: any = { name, status, managerId, isArchived }
    
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data
    })
    
    if (members !== undefined) {
      await prisma.projectMember.deleteMany({ where: { projectId: parseInt(id) } })
      if (members.length > 0) {
        await prisma.projectMember.createMany({
          data: members.map((userId: number) => ({
            projectId: parseInt(id),
            userId,
            isManager: userId === managerId
          }))
        })
      }
    }
    
    res.json(project)
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '项目不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}

export async function deleteProject(req: Request, res: Response) {
  try {
    const { id } = req.params
    
    await prisma.project.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ message: '项目已删除' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '项目不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}

export async function reviewProject(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { reviewerId, score } = req.body
    
    let level = '不合格'
    if (score >= 90) level = '优秀'
    else if (score >= 80) level = '良好'
    else if (score >= 70) level = '一般'
    else if (score >= 60) level = '合格'
    
    const review = await prisma.review.create({
      data: {
        type: 'project',
        targetId: parseInt(id),
        reviewerId,
        score,
        level
      }
    })
    
    await prisma.project.update({
      where: { id: parseInt(id) },
      data: { status: '已评审' }
    })
    
    res.json(review)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}