// src/routes/auth.routes.ts
import { Router } from 'express';
import {
  approveUser,
  loginUser,
  validateToken,
} from '../controllers/auth.controller';
import auth from '../middlewares/auth';

const router = Router();

router.get('/approve', approveUser);
router.post('/login', loginUser);
router.get('/validate-token', auth, validateToken);

export default router;
