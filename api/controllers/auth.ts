import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import bcrypt from 'bcrypt'
import { signToken } from '../utils/jwt'
import { recordLog } from '../lib/logHelper'

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }
    
    const user = await prisma.user.findUnique({
      where: { username },
      include: { department: true }
    })
    
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }
    
    const token = signToken({
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      departmentId: user.departmentId
    })
    
    recordLog(user.id, '登录', `${user.nickname} 登录了系统`)
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        departmentId: user.departmentId,
        department: user.department.name
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function me(req: any, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { department: true }
    })
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    res.json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      departmentId: user.departmentId,
      department: user.department.name
    })
  } catch (error) {
    console.error('Me error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}