// src/routes/domain.routes.ts
import { Router } from 'express'
import { publishDomain } from '../controllers/domain.controller'
import auth from '../middlewares/auth'

const router = Router()

router.post('/publish', auth, publishDomain)

export default router