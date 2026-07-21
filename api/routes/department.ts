import express from 'express'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/department'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

router.get('/', authMiddleware, getDepartments)
router.post('/', authMiddleware, createDepartment)
router.put('/:id', authMiddleware, updateDepartment)
router.delete('/:id', authMiddleware, deleteDepartment)

export default router