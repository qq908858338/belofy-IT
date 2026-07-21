import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import bcrypt from 'bcrypt'

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
    
    const data: any = { nickname, departmentId }
    
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      include: { department: true }
    })
    
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
    
    await prisma.user.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ message: '用户已删除' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '用户不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}