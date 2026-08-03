import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { recordLog } from '../lib/logHelper'
import type { AuthRequest } from '../middleware/auth'

export async function getReports(req: Request, res: Response) {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: true,
        task: {
          include: {
            user: true,
            project: true,
            members: { include: { user: true } }
          }
        },
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
        task: {
          include: {
            user: true,
            project: true,
            members: { include: { user: true } }
          }
        },
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
    
    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
    const endOfLastWeek = new Date(endOfWeek)
    endOfLastWeek.setDate(endOfLastWeek.getDate() - 7)
    
    const [currentReports, lastWeekReports] = await Promise.all([
      prisma.report.findMany({
        where: {
          type: 'daily',
          userId: userId ? parseInt(userId as string) : undefined,
          reportDate: {
            gte: startOfWeek,
            lte: endOfWeek
          }
        },
        include: { user: true, task: true }
      }),
      prisma.report.findMany({
        where: {
          type: 'daily',
          userId: userId ? parseInt(userId as string) : undefined,
          reportDate: {
            gte: startOfLastWeek,
            lte: endOfLastWeek
          }
        },
        include: { task: true }
      })
    ])
    
    const lastWeekSummary = lastWeekReports.reduce((acc, report) => {
      const key = `${report.userId}-${report.taskId}`
      if (!acc[key]) {
        acc[key] = { totalCompleted: 0, totalUsedHours: 0 }
      }
      acc[key].totalCompleted += report.completedQuantity
      acc[key].totalUsedHours += report.usedHours
      return acc
    }, {} as Record<string, any>)
    
    const weeklySummary = currentReports.reduce((acc, report) => {
      const key = `${report.userId}-${report.taskId}`
      const lastWeek = lastWeekSummary[key] || { totalCompleted: 0, totalUsedHours: 0 }
      
      if (!acc[key]) {
        const targetQty = report.task?.targetQuantity || 0
        const unit = report.task?.unit || '个'
        const actualCompleted = report.task?.completedQuantity || 0
        
        acc[key] = {
          userId: report.userId,
          userName: report.user.nickname,
          taskId: report.taskId,
          taskName: report.task.name,
          taskType: report.task.type,
          targetQuantity: targetQty,
          unit: unit,
          actualCompleted: actualCompleted,
          weekCompleted: 0,
          totalUsedHours: 0,
          lastWeekCompleted: lastWeek.totalCompleted,
          lastWeekUsedHours: lastWeek.totalUsedHours
        }
      }
      acc[key].weekCompleted += report.completedQuantity
      acc[key].totalUsedHours += report.usedHours
      return acc
    }, {} as Record<string, any>)
    
    res.json(Object.values(weeklySummary))
  } catch (error) {
    console.error('getWeeklyReports error:', error)
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
    const { type, userId, taskId, completedQuantity, usedHours, status, reportDate, blocker, helpers, attachments, resultDesc } = req.body
    const authReq = req as AuthRequest
    
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    
    const report = await prisma.report.create({
      data: {
        type,
        userId,
        taskId,
        completedQuantity,
        usedHours,
        status,
        reportDate: new Date(reportDate),
        blocker: blocker || null,
        helpers: helpers || null,
        attachments: attachments || null,
        resultDesc: resultDesc || null
      }
    })
    
    await prisma.task.update({
      where: { id: taskId },
      data: {
        completedQuantity: { increment: completedQuantity }
      }
    })
    
    recordLog(authReq.user?.userId, '提交', `提交了任务"${task?.name || taskId}"的汇报`)
    
    res.status(201).json(report)
  } catch (error) {
    console.error('Create report error:', error)
    res.status(500).json({ message: '服务器内部错误', error: (error as any)?.message })
  }
}

export async function updateReport(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { completedQuantity, usedHours, status } = req.body
    const authReq = req as AuthRequest
    
    const report = await prisma.report.findUnique({ where: { id: parseInt(id) } })
    
    if (!report) {
      return res.status(404).json({ message: '汇报不存在' })
    }
    
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (completedQuantity !== undefined) updateData.completedQuantity = completedQuantity
    if (usedHours !== undefined) updateData.usedHours = usedHours
    
    if (completedQuantity !== undefined) {
      const diff = completedQuantity - report.completedQuantity
      if (diff !== 0) {
        await prisma.task.update({
          where: { id: report.taskId },
          data: {
            completedQuantity: { increment: diff }
          }
        })
      }
    }
    
    const updatedReport = await prisma.report.update({
      where: { id: parseInt(id) },
      data: updateData
    })
    
    recordLog(authReq.user?.userId, '更新', `更新了ID为"${id}"的汇报信息`)
    
    res.json(updatedReport)
  } catch (error) {
    console.error('Update report error:', error)
    res.status(500).json({ message: '服务器内部错误', error: (error as any)?.message })
  }
}

export async function deleteReport(req: Request, res: Response) {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    
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
    
    await prisma.comment.deleteMany({ where: { reportId: parseInt(id) } })
    await prisma.review.deleteMany({ where: { targetId: parseInt(id), type: 'report' } })
    
    await prisma.report.delete({
      where: { id: parseInt(id) }
    })
    
    recordLog(authReq.user?.userId, '删除', `删除了ID为"${id}"的汇报`)
    
    res.json({ message: '汇报已删除' })
  } catch (error) {
    console.error('Delete report error:', error)
    res.status(500).json({ message: '服务器内部错误', error: (error as any)?.message })
  }
}

export async function addComment(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { userId, content } = req.body
    const authReq = req as AuthRequest
    
    const comment = await prisma.comment.create({
      data: {
        reportId: parseInt(id),
        userId,
        content
      },
      include: { user: true }
    })
    
    recordLog(authReq.user?.userId, '评论', `在汇报ID"${id}"中添加了评论`)
    
    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function addReview(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { reviewerId, score } = req.body
    const authReq = req as AuthRequest
    
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
    
    recordLog(authReq.user?.userId, '评审', `评审了汇报ID"${id}"，评分${score}分`)
    
    res.json(review)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}