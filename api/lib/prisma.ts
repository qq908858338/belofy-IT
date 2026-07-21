import 'dotenv/config'
import { PrismaClient } from '../../prisma/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { resolve } from 'path'

const dbPath = process.env.DATABASE_URL || 'file:./dev.db'

const adapter = new PrismaBetterSqlite3({
  url: dbPath.startsWith('file:') 
    ? `file:${resolve(process.cwd(), dbPath.replace('file:', ''))}` 
    : dbPath,
})

const prisma = new PrismaClient({ adapter })

export default prisma