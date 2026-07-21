import express from 'express'
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

router.get('/', authMiddleware, getUsers)
router.post('/', authMiddleware, createUser)
router.put('/:id', authMiddleware, updateUser)
router.delete('/:id', authMiddleware, deleteUser)

export default router