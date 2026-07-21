import express from 'express'
import { getSettings, updateSettings } from '../controllers/setting'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

router.get('/data', authMiddleware, getSettings)
router.put('/data', authMiddleware, updateSettings)

export default router