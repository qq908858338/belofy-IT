import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { recordLog } from '../lib/logHelper'
import type { AuthRequest } from '../middleware/auth'

export async function getDepartments(req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany()
    res.json(departments)
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function createDepartment(req: Request, res: Response) {
  try {
    const { name } = req.body
    const authReq = req as AuthRequest
    
    const department = await prisma.department.create({
      data: { name }
    })
    
    recordLog(authReq.user?.userId, '创建', `创建了部门"${department.name}"`)
    
    res.status(201).json(department)
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: '部门名称已存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}

export async function updateDepartment(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name } = req.body
    const authReq = req as AuthRequest
    
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name }
    })
    
    recordLog(authReq.user?.userId, '更新', `更新了部门"${department.name}"的信息`)
    
    res.json(department)
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '部门不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}

export async function deleteDepartment(req: Request, res: Response) {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    
    const department = await prisma.department.findUnique({ where: { id: parseInt(id) } })
    
    await prisma.department.delete({
      where: { id: parseInt(id) }
    })
    
    recordLog(authReq.user?.userId, '删除', `删除了部门"${department?.name || id}"`)
    
    res.json({ message: '部门已删除' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '部门不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}