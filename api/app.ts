import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import prisma from './lib/prisma.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import departmentRoutes from './routes/department.js'
import taskRoutes from './routes/task.js'
import projectRoutes from './routes/project.js'
import reportRoutes from './routes/report.js'
import settingRoutes from './routes/setting.js'
import logRoutes from './routes/log.js'
import achievementRoutes from './routes/achievement.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

async function initializeDatabase() {
  try {
    const adminDept = await prisma.department.upsert({
      where: { name: '管理层' },
      update: {},
      create: { name: '管理层' }
    })
    
    const techDept = await prisma.department.upsert({
      where: { name: '技术部' },
      update: {},
      create: { name: '技术部' }
    })
    
    const adminDept2 = await prisma.department.upsert({
      where: { name: '行政部' },
      update: {},
      create: { name: '行政部' }
    })
    
    const password = await bcrypt.hash('Belofy2026', 10)
    
    await prisma.user.upsert({
      where: { username: 'roman' },
      update: {},
      create: { username: 'roman', nickname: '梁总', departmentId: adminDept.id, password }
    })
    
    await prisma.user.upsert({
      where: { username: 'laochen' },
      update: {},
      create: { username: 'laochen', nickname: '老陈', departmentId: adminDept.id, password }
    })
    
    await prisma.user.upsert({
      where: { username: 'golden' },
      update: {},
      create: { username: 'golden', nickname: '小秦', departmentId: techDept.id, password }
    })
    
    await prisma.user.upsert({
      where: { username: 'shilong' },
      update: {},
      create: { username: 'shilong', nickname: '世龙', departmentId: techDept.id, password }
    })
    
    await prisma.user.upsert({
      where: { username: 'zhijun' },
      update: {},
      create: { username: 'zhijun', nickname: '梓君', departmentId: adminDept2.id, password }
    })
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

initializeDatabase()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/settings', settingRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/achievements', achievementRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app