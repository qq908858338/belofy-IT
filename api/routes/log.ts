import express from 'express'
import { getLogs, createLog, exportLogs } from '../controllers/log'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

router.get('/', authMiddleware, getLogs)
router.post('/', authMiddleware, createLog)
router.post('/export', authMiddleware, exportLogs)

export default router