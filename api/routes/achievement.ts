import express from 'express'
import { getAchievements, createAchievement, deleteAchievement } from '../controllers/achievement'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

router.get('/', authMiddleware, getAchievements)
router.post('/', authMiddleware, createAchievement)
router.delete('/:id', authMiddleware, deleteAchievement)

export default router