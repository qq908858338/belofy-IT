import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function getTasks(req: Request, res: Response) {
  try {
    const { userId, type, isArchived, projectId } = req.query
    
    const tasks = await prisma.task.findMany({
      where: {
        userId: userId ? parseInt(userId as string) : undefined,
        type: type as string,
        isArchived: isArchived ? isArchived === 'true' : undefined,
        projectId: projectId ? parseInt(projectId as string) : undefined
      },
      include: {
        user: { include: { department: true } },
        project: true,
        members: { include: { user: { include: { department: true } } } }
      }
    })
    
    res.json(tasks.map(task => ({
      ...task,
      user: task.user ? {
        id: task.user.id,
        username: task.user.username,
        nickname: task.user.nickname,
        departmentId: task.user.departmentId,
        department: task.user.department?.name || '',
        createdAt: task.user.createdAt,
        updatedAt: task.user.updatedAt
      } : null,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name,
        description: task.project.description,
        icon: task.project.icon,
        status: task.project.status,
        managerId: task.project.managerId,
        isArchived: task.project.isArchived,
        createdAt: task.project.createdAt,
        updatedAt: task.project.updatedAt
      } : null,
      members: task.members.map(member => ({
        ...member,
        user: member.user ? {
          id: member.user.id,
          username: member.user.username,
          nickname: member.user.nickname,
          departmentId: member.user.departmentId,
          department: member.user.department?.name || '',
          createdAt: member.user.createdAt,
          updatedAt: member.user.updatedAt
        } : null
      }))
    })))
  } catch (error: any) {
    console.error('getTasks error:', error.message || error)
    res.status(500).json({ message: '服务器内部错误', detail: error.message })
  }
}

export async function createTask(req: Request, res: Response) {
  try {
    const { name, type, status, priority, targetQuantity, unit, completedQuantity, hoursPerUnit, startTime, endTime, description, projectId, userId, members } = req.body
    
    const task = await prisma.task.create({
      data: {
        name,
        type,
        status,
        priority,
        targetQuantity,
        unit,
        completedQuantity: completedQuantity || 0,
        hoursPerUnit,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        description,
        projectId: projectId || undefined,
        userId
      },
      include: {
        user: { include: { department: true } },
        project: true,
        members: { include: { user: { include: { department: true } } } }
      }
    })
    
    if (members && members.length > 0) {
      await prisma.taskMember.createMany({
        data: members.map((userId: number) => ({ taskId: task.id, userId }))
      })
    }
    
    const taskWithMembers = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        user: { include: { department: true } },
        project: true,
        members: { include: { user: { include: { department: true } } } }
      }
    })
    
    res.status(201).json({
      ...taskWithMembers,
      user: taskWithMembers?.user ? {
        id: taskWithMembers.user.id,
        username: taskWithMembers.user.username,
        nickname: taskWithMembers.user.nickname,
        departmentId: taskWithMembers.user.departmentId,
        department: taskWithMembers.user.department?.name || '',
        createdAt: taskWithMembers.user.createdAt,
        updatedAt: taskWithMembers.user.updatedAt
      } : null,
      project: taskWithMembers?.project ? {
        id: taskWithMembers.project.id,
        name: taskWithMembers.project.name,
        description: taskWithMembers.project.description,
        icon: taskWithMembers.project.icon,
        status: taskWithMembers.project.status,
        managerId: taskWithMembers.project.managerId,
        isArchived: taskWithMembers.project.isArchived,
        createdAt: taskWithMembers.project.createdAt,
        updatedAt: taskWithMembers.project.updatedAt
      } : null,
      members: taskWithMembers?.members.map(member => ({
        ...member,
        user: member.user ? {
          id: member.user.id,
          username: member.user.username,
          nickname: member.user.nickname,
          departmentId: member.user.departmentId,
          department: member.user.department?.name || '',
          createdAt: member.user.createdAt,
          updatedAt: member.user.updatedAt
        } : null
      })) || []
    })
  } catch (error: any) {
    console.error('createTask error:', error.message || error)
    res.status(500).json({ message: '服务器内部错误', detail: error.message })
  }
}

export async function updateTask(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, type, status, priority, targetQuantity, unit, completedQuantity, hoursPerUnit, startTime, endTime, description, projectId, isArchived, members } = req.body
    
    const data: any = {
      name,
      type,
      status,
      priority,
      targetQuantity,
      unit,
      completedQuantity,
      hoursPerUnit,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      description,
      projectId: projectId || undefined,
      isArchived
    }
    
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data
    })
    
    if (members !== undefined) {
      await prisma.taskMember.deleteMany({ where: { taskId: parseInt(id) } })
      if (members.length > 0) {
        await prisma.taskMember.createMany({
          data: members.map((userId: number) => ({ taskId: parseInt(id), userId }))
        })
      }
    }
    
    res.json(task)
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '任务不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const { id } = req.params
    const taskId = parseInt(id)
    
    await prisma.taskMember.deleteMany({ where: { taskId } })
    await prisma.report.deleteMany({ where: { taskId } })
    await prisma.achievement.deleteMany({ where: { taskId } })
    await prisma.review.deleteMany({ where: { targetId: taskId, type: 'task' } })
    
    await prisma.task.delete({
      where: { id: taskId }
    })
    
    res.json({ message: '任务已删除' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '任务不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}