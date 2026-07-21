import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function getReports(req: Request, res: Response) {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: true,
        task: true,
        comments: { include: { user: true } },
        reviews: true
      }
    })
    res.json(reports)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function getDailyReports(req: Request, res: Response) {
  try {
    const { userId, reportDate } = req.query
    
    const reports = await prisma.report.findMany({
      where: {
        type: 'daily',
        userId: userId ? parseInt(userId as string) : undefined,
        reportDate: reportDate ? new Date(reportDate as string) : undefined
      },
      include: {
        user: true,
        task: true,
        comments: { include: { user: true } },
        reviews: true
      }
    })
    
    res.json(reports)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function getWeeklyReports(req: Request, res: Response) {
  try {
    const { userId } = req.query
    
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    const reports = await prisma.report.findMany({
      where: {
        type: 'daily',
        userId: userId ? parseInt(userId as string) : undefined,
        reportDate: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      include: { user: true, task: true }
    })
    
    const weeklySummary = reports.reduce((acc, report) => {
      const key = `${report.userId}-${report.taskId}`
      if (!acc[key]) {
        acc[key] = {
          userId: report.userId,
          userName: report.user.nickname,
          taskId: report.taskId,
          taskName: report.task.name,
          taskType: report.task.type,
          totalCompleted: 0,
          totalUsedHours: 0
        }
      }
      acc[key].totalCompleted += report.completedQuantity
      acc[key].totalUsedHours += report.usedHours
      return acc
    }, {} as Record<string, any>)
    
    res.json(Object.values(weeklySummary))
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function getMonthlyReports(req: Request, res: Response) {
  try {
    const { userId } = req.query
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const dailyReports = await prisma.report.findMany({
      where: {
        type: 'daily',
        userId: userId ? parseInt(userId as string) : undefined,
        reportDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: { user: true, task: true }
    })
    
    const monthlySummary = dailyReports.reduce((acc, report) => {
      if (!acc[report.userId]) {
        acc[report.userId] = {
          userId: report.userId,
          userName: report.user.nickname,
          reportCount: 0,
          projectCount: new Set<number>(),
          taskCount: new Set<number>(),
          totalCompleted: 0
        }
      }
      acc[report.userId].reportCount++
      if (report.task.projectId) {
        acc[report.userId].projectCount.add(report.task.projectId)
      }
      acc[report.userId].taskCount.add(report.taskId)
      acc[report.userId].totalCompleted += report.completedQuantity
      return acc
    }, {} as Record<number, any>)
    
    res.json(Object.values(monthlySummary).map((item: any) => ({
      ...item,
      projectCount: item.projectCount.size,
      taskCount: item.taskCount.size
    })))
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function createReport(req: Request, res: Response) {
  try {
    const { type, userId, taskId, completedQuantity, usedHours, status, reportDate } = req.body
    
    const report = await prisma.report.create({
      data: {
        type,
        userId,
        taskId,
        completedQuantity,
        usedHours,
        status,
        reportDate: new Date(reportDate)
      }
    })
    
    await prisma.task.update({
      where: { id: taskId },
      data: {
        completedQuantity: { increment: completedQuantity }
      }
    })
    
    res.status(201).json(report)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function updateReport(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { completedQuantity, usedHours, status } = req.body
    
    const report = await prisma.report.findUnique({ where: { id: parseInt(id) } })
    
    if (!report) {
      return res.status(404).json({ message: '汇报不存在' })
    }
    
    const diff = completedQuantity - report.completedQuantity
    
    const updatedReport = await prisma.report.update({
      where: { id: parseInt(id) },
      data: { completedQuantity, usedHours, status }
    })
    
    await prisma.task.update({
      where: { id: report.taskId },
      data: {
        completedQuantity: { increment: diff }
      }
    })
    
    res.json(updatedReport)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function deleteReport(req: Request, res: Response) {
  try {
    const { id } = req.params
    
    const report = await prisma.report.findUnique({ where: { id: parseInt(id) } })
    
    if (!report) {
      return res.status(404).json({ message: '汇报不存在' })
    }
    
    await prisma.task.update({
      where: { id: report.taskId },
      data: {
        completedQuantity: { decrement: report.completedQuantity }
      }
    })
    
    await prisma.report.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ message: '汇报已删除' })
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function addComment(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { userId, content } = req.body
    
    const comment = await prisma.comment.create({
      data: {
        reportId: parseInt(id),
        userId,
        content
      },
      include: { user: true }
    })
    
    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function addReview(req: Request, res: Response) {
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
        type: 'report',
        targetId: parseInt(id),
        reviewerId,
        score,
        level
      }
    })
    
    res.json(review)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}