import express from 'express'
import { getProjects, getProject, createProject, updateProject, deleteProject, reviewProject } from '../controllers/project'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

router.get('/', authMiddleware, getProjects)
router.get('/:id', authMiddleware, getProject)
router.post('/', authMiddleware, createProject)
router.put('/:id', authMiddleware, updateProject)
router.delete('/:id', authMiddleware, deleteProject)
router.post('/:id/review', authMiddleware, reviewProject)

export default router