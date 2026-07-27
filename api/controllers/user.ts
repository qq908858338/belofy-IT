import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import bcrypt from 'bcrypt'
import { recordLog } from '../lib/logHelper'
import type { AuthRequest } from '../middleware/auth'

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      include: { department: true }
    })
    
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      departmentId: u.departmentId,
      department: u.department.name,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    })))
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { username, nickname, departmentId, password } = req.body
    const authReq = req as AuthRequest
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        username,
        nickname,
        departmentId,
        password: hashedPassword
      },
      include: { department: true }
    })
    
    recordLog(authReq.user?.userId, '创建', `创建了用户"${user.nickname}"`)
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      departmentId: user.departmentId,
      department: user.department.name
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: '用户名已存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { nickname, departmentId, password } = req.body
    const authReq = req as AuthRequest
    
    const data: any = { nickname, departmentId }
    
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      include: { department: true }
    })
    
    recordLog(authReq.user?.userId, '更新', `更新了用户"${user.nickname}"的信息`)
    
    res.json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      departmentId: user.departmentId,
      department: user.department.name
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '用户不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    
    await prisma.user.delete({
      where: { id: parseInt(id) }
    })
    
    recordLog(authReq.user?.userId, '删除', `删除了用户"${user?.nickname || id}"`)
    
    res.json({ message: '用户已删除' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '用户不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}