import express from 'express'
import { getReports, getDailyReports, getWeeklyReports, getMonthlyReports, getArchivedDailyReports, getArchivedWeeklyReports, createReport, updateReport, deleteReport, addComment, addReview } from '../controllers/report'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

router.get('/', authMiddleware, getReports)
router.get('/daily', authMiddleware, getDailyReports)
router.get('/weekly', authMiddleware, getWeeklyReports)
router.get('/monthly', authMiddleware, getMonthlyReports)
router.get('/archived/daily', authMiddleware, getArchivedDailyReports)
router.get('/archived/weekly', authMiddleware, getArchivedWeeklyReports)
router.post('/', authMiddleware, createReport)
router.put('/:id', authMiddleware, updateReport)
router.delete('/:id', authMiddleware, deleteReport)
router.post('/:id/comment', authMiddleware, addComment)
router.post('/:id/review', authMiddleware, addReview)

export default router