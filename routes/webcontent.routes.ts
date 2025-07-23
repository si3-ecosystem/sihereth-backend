// src/routes/webcontent.routes.ts
import { Router } from 'express'
import { publishWebContent, updateWebContent } from '../controllers/webcontent.controller'
import auth from '../middlewares/auth'

const router = Router()

router.post('/publish', auth, publishWebContent)
router.post('/update',  auth, updateWebContent)

export default router
