import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcrypt'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const departments = ['外贸部', '行政部', '技术部', '回收部', '管理层']
  
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }
  
  const managementDept = await prisma.department.findUnique({ where: { name: '管理层' } })
  const techDept = await prisma.department.findUnique({ where: { name: '技术部' } })
  const adminDept = await prisma.department.findUnique({ where: { name: '行政部' } })
  
  const password = await bcrypt.hash('Belofy2026', 10)
  
  const users = [
    { username: 'roman', nickname: '梁总', departmentId: managementDept!.id },
    { username: 'laochen', nickname: '老陈', departmentId: managementDept!.id },
    { username: 'golden', nickname: '小秦', departmentId: techDept!.id },
    { username: 'shilong', nickname: '世龙', departmentId: techDept!.id },
    { username: 'zhijun', nickname: '梓君', departmentId: adminDept!.id },
  ]
  
  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { ...user, password }
    })
  }
  
  const defaultSettings = [
    { key: 'workDaysPerMonth', value: '22' },
    { key: 'dailyReportWeight', value: '30' },
    { key: 'taskOnTimeWeight', value: '30' },
    { key: 'taskReviewWeight', value: '40' },
    { key: 'loadBaseHours', value: '40' },
  ]
  
  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    })
  }
  
  console.log('Seed data created successfully')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })