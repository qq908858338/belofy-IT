import { Request, Response } from 'express'
import prisma from '../lib/prisma'

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
    
    const department = await prisma.department.create({
      data: { name }
    })
    
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
    
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name }
    })
    
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
    
    await prisma.department.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ message: '部门已删除' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: '部门不存在' })
    } else {
      res.status(500).json({ message: '服务器内部错误' })
    }
  }
}