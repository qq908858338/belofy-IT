import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function getSettings(req: Request, res: Response) {
  try {
    const settings = await prisma.systemSetting.findMany()
    res.json(settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}))
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const settings = req.body
    
    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    }
    
    res.json({ message: '设置已更新' })
  } catch (error) {
    res.status(500).json({ message: '服务器内部错误' })
  }
}